'use strict';

const uuidv4 = require('uuid/v4')
const uuidv5 = require('uuid/v5')

const ErrorTracer = ((global) => {
  return class ErrorTracer {
    constructor() {
      this.clientId = uuidv4()
      this.history = []
      this.isActive = false

      this.init(arguments)
    }

    active() {
      this.isActive = true
    }

    deactive() {
      this.isActive = false
    }

    reset() {
      this.history = []
      this.isActive = false
      
      delete this.callback
      delete this.apiURL
      delete this.ignore
    }

    init(args) {
      this.root = global
      this.sourceRange = 10
      
      if (args.length === 1 && args[0].constructor === Object) {
        this.callback = args[0].callback
        this.apiURL = args[0].apiURL
        this.sourceRange = args[0].sourceRange || 10

        if (args[0].ignore) {
          this.ignore = Array.isArray(args[0].ignore) ? args[0].ignore : [args[0].ignore]
        }
      }
      else if (args.length === 1 && typeof args[0] === 'function') {
        this.callback = args[0]
      }
      else if (args.length === 1 && typeof args[0] === 'string') {
        this.apiURL = args[0]
      }
      else {
        return null
      }

      this.root.addEventListener('error', _errorHandler.bind(this))
      this.root.addEventListener('unhandledrejection', _errorHandler.bind(this))
      this.root.addEventListener('rejectionhandled', _errorHandler.bind(this))

      this.active()
    }  
  }

  async function _errorHandler(error) {
    const errorTracer = this
    try {
      if (!errorTracer.isActive) {
        return null
      }

      if (errorTracer.ignore && errorTracer.ignore.includes(error.message)) {
        return null
      }

      if (error.reason && error.reason.code === "ERRORTRACE") {
        if (process && process.env && process.env.NODE_ENV === 'development') {
          console.log("[ErrorTracer DevMode] ", error)
        }

        error.preventDefault()
        error.stopPropagation()
        return null
      }

      let item = await _createErrorItem.call(errorTracer, error)
      errorTracer.history.push(item)

      if (errorTracer.callback) {
        errorTracer.callback(item)
      }

      if (errorTracer.apiURL) {
        _sendApi(errorTracer.apiURL, item)
      }
    } catch (error) {
      // should do something.
    }
  }

  async function _createErrorItem(error) {
    const errorTracer = this
    let item = {
      errorId: uuidv5(JSON.stringify(error), errorTracer.clientId),
      clientId: errorTracer.clientId,
      location: errorTracer.root.location.href,
      error,
      environment: {
        navigator: errorTracer.root.navigator,
        localStorage,
        sessionStorage,
        cookie: errorTracer.root.document.cookie,
      },
      timeStamp: Date.now(),
    }

    if (error.filename && error.lineno) {
      item.source = await _getSource.call(errorTracer, error)
      item.errorLineNo = error.lineno
    }

    return item
  }

  function _getSource({ filename, lineno }) {
    return fetch(filename)
      .then(res => {
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        return res;
      })
      .then(res => res.text() || "")
      .then(text => {
        let slicedSource = []
        try {
          const source = text.split(/\r?\n/)
          const range = Math.ceil(this.sourceRange / 2)

          for (let i = Math.max(0, lineno - range); i < Math.min(source.length, lineno + range); ++i) {
            const lineNo = i + 1
            const content = source[i]

            slicedSource.push({
              lineNo,
              content,
            })
          }
        } catch (e) {
          e.code = "ERRORTRACE"
          throw e
        }
        return slicedSource
      })
  }

  function _sendApi(apiURL, ErrorTracerItem) {
    return fetch(apiURL, {
      method: 'POST',
      body: JSON.stringify(ErrorTracerItem),
      cache: 'no-cache',
      headers: {
        'content-type': 'text/plain'
      },
      mode: 'cors',
      redirect: 'follow', // manual, *follow, error
    })
    .then(res => {
      if (!res.ok) {
        const e = new Error(res.statusText)
        e.code = "ERRORTRACE"
        throw e
      }
      return res
    })
    .catch(e => {
      e.code = "ERRORTRACE"
      throw e
    })
  }
})(global || window)


export default ErrorTracer
