'use strict';

const uuidv4 = require('uuid/v4')
const uuidv5 = require('uuid/v5')

const ErrorTracer = ((global) => {
  return class ErrorTracer {
    constructor() {
      this.clientId = uuidv4()
      this.root = global

      this.init(arguments)
    }

    active() {
      this.isActive = true
    }

    deactive() {
      this.isActive = false
    }

    reset() {
      this.perpare()
      this.deactive()
    }

    perpare() {
      this.triggers = ['error', 'unhandledrejection', 'rejectionhandled']
      this.callback = undefined
      this.apiURL = undefined
      this.sourceRange = 10
      this.ignores = []
      this.history = []
    }

    init(args) {
      this.perpare()

      if (args.length !== 1) {
        return null
      }

      const arg = args[0]

      if (arg.constructor === Object) {
        if (arg.triggers) {
          this.triggers = Array.isArray(arg.triggers) ? arg.triggers : [arg.triggers]
        }
        this.callback = arg.callback || this.call
        this.apiURL = arg.apiURL || this.apiURL
        this.sourceRange = arg.sourceRange || this.sourceRange
        if (arg.ignores) {
          this.ignores = Array.isArray(arg.ignore) ? arg.ignores : [arg.ignores]
        }
      } else if (typeof arg === 'function') {
        this.callback = arg
      } else if (typeof arg === 'string') {
        this.apiURL = arg
      }

      this.triggers.forEach(trigger => {
        this.root.addEventListener(trigger, _errorHandler.bind(this))
      })

      this.active()
    }  
  }

  async function _errorHandler(error) {
    const errorTracer = this
    try {
      if (!errorTracer.isActive) {
        return null
      }

      if (errorTracer.ignores && errorTracer.ignores.includes(error.message)) {
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
      item.source = await _getSource(errorTracer.sourceRange, error.filename, error.lineno)
      item.errorLineNo = error.lineno
    }

    return item
  }

  function _getSource(sourceRange, filename, lineno) {
    return fetch(filename)
      .then(res => {
        if (!res.ok) {
          const e = new Error(res.statusText)
          e.code = "ERRORTRACE"
          throw e
        }
        return res;
      })
      .then(res => res.text() || "")
      .then(text => {
        let slicedSource = []
        try {
          const source = text.split(/\r?\n/)
          const range = Math.ceil(sourceRange / 2)

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
