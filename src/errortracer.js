const uuidv4 = require('uuid/v4')

class ErrorTrace {
  constructor() {
    this.uuid = uuidv4()
    this.history = []
    this.isActive = true

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
    if (args.length === 1 && args[0].constructor === Object) {
      this.root = window
      this.callback = args[0].callback
      this.apiURL = args[0].apiURL

      if (args[0].ignore) {
        this.ignore = Array.isArray(args[0].ignore) ? args[0].ignore : [args[0].ignore]
      }
    }
    else if (args.length === 1 && typeof args[0] === 'function') {
      this.root = window
      this.callback = args[0]
    }

    this.root.addEventListener('error', this.errorHandler.bind(this))
    this.root.addEventListener('unhandledrejection', this.errorHandler.bind(this))
    this.root.addEventListener('rejectionhandled', this.errorHandler.bind(this))
  }

  async errorHandler(error) {
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

      let item = await this.createErrorItem(error)

      this.history.push(item)

      if (this.callback) {
        this.callback(item)
      }
      if (this.apiURL) {
        this.sendApi(item)
      }
    } catch (error) {
      // should do something.
    }
  }

  async createErrorItem(error) {
    let errorTracerItem = {
      uuid: this.uuid,
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
      errorTracerItem.source = await this.getSource(error)
      errorTracerItem.errorLineNo = error.lineno
    }

    return errorTracerItem
  }

  getSource({ filename, lineno }) {
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

          for (let i=Math.max(0, lineno - 10); i<Math.min(source.length, lineno + 10); ++i) {
            const lineNo = i + 1
            let lineString = {}
            lineString[lineNo] = source[i]
            slicedSource.push(lineString)
          }
        } catch (e) {
          e.code = "ERRORTRACE"
          throw e
        }
        return slicedSource
      })
  }

  sendApi(ErrorTracerItem) {
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
}

export default ErrorTrace
