const uuidv4 = require('uuid/v4')
const uuidv5 = require('uuid/v5')

const ErrorTracer = (() => {
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
      delete this.callback
      delete this.apiURL
      delete this.ignore
    }

    init(args) {
      this.root = window
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

      this.root.addEventListener('error', errorHandler.bind(this))
      this.root.addEventListener('unhandledrejection', errorHandler.bind(this))
      this.root.addEventListener('rejectionhandled', errorHandler.bind(this))

      this.active()
    }  
  }

  async function errorHandler(error) {
    try {
      if (!this.isActive) {
        return null
      }

      if (this.ignore && this.ignore.includes(error.message)) {
        return null
      }

      if (error.reason && error.reason.code === "ERRORTRACE") {
        error.preventDefault()
        error.stopPropagation()
        return null
      }

      let item = await createErrorItem.call(this, error)

      this.history.push(item)

      if (this.callback) {
        this.callback(item)
      }
      if (this.apiURL) {
        sendApi(item)
      }
    } catch (error) {
      // should do something.
    }
  }

  async function createErrorItem(error) {
    let errorTracerItem = {
      errorId: uuidv5(JSON.stringify(error), this.clientId),
      clientId: this.clientId,
      location: window.location.href,
      error,
      environment: {
        navigator: window.navigator,
        localStorage,
        sessionStorage,
        cookie: document.cookie,
      },
      timeStamp: Date.now(),
    }

    if (error.filename && error.lineno) {
      errorTracerItem.source = await getSource.call(this, error)
      errorTracerItem.errorLineNo = error.lineno
    }

    return errorTracerItem
  }

  function getSource({
    filename,
    lineno
  }) {
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

  function sendApi(ErrorTracerItem) {
    return fetch(this.apiURL, {
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
      return res;
    })
    .catch(e => {
      e.code = "ERRORTRACE"
      throw e
    })
  }
})()


export default ErrorTracer
