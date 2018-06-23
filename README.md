# Error-Tracer
[![DeepScan grade](https://deepscan.io/api/projects/2684/branches/18686/badge/grade.svg)](https://deepscan.io/dashboard#view=project&pid=2684&bid=18686)

Error-Tracer will help to trace client errors.

![ErrorTracer](https://user-images.githubusercontent.com/25057349/41692482-88432d6c-753b-11e8-9493-07a22aa3c6d6.png)

1. **Collect client error.**  
Users don't report an error. They just go away and forget the error.

2. **Capture the source code when error occurred.**  
Sometimes source codes are overwritten. So it makes difficult to recognize what has been the problem.

3. **Snapshot of user's environment when error occurred.**  
What was the user browser?
What was the data in local/sessionStorage or cookie?
What time was error occurred?


## Install
```
npm install --save error-tracer
yarn add -D error-tracer
```
or browser
```
<script src="https://unpkg.com/error-tracer@latest/dist/errortracer.bundle.js"></script>
```


## Import
```
import ErrorTracer from 'error-tracer';
const ErrorTracer = require('error-tracer');
```
or browser
```
<script src="https://unpkg.com/error-tracer@latest/dist/errortracer.bundle.js"></script>
```

## Usage
### with Constructor
Note that default trigger error events are `'error', 'unhandledrejection', 'rejectionhandled'`.

1. object (you can set triggers(error), callback, apiURL, sourceRange and ignores)
```
new ErrorTracer({
  triggers: ['my_custome_error1', 'other_error'], // error events which observed
  callback: function(e) { console.log(1, e) },
  apiURL: "http://aaa.com",
  sourceRange: 30, // line range will be captured (default: 10)
  ignores: "error_message"
  // ignores: ["Custom_Error1", Customer_Error2"]
});
```
2. function (you can set just only callback function)
```
new ErrorTracer(function (errorItem) {
  console.error("this is handled by error-tracer", errorItem);
});
```
3. string (you can set just apiURL which get report)
```
new ErrorTracer("http://xxx.com..."); // ErrorTracer Item will be posted
```

### with init method
> same usage with constructor
```
const errorTrace1 = new ErrorTracer();

errorTrace1.init(function (errItem) {
  console.log("errItem: ", errItem);
});
```

## API
### Methods
| Name              | Type     | parameter                            | description                          |
|-------------------|----------|--------------------------------------|--------------------------------------|
| init(_parameter_) | Function | _object_, _function_, _string_ | Initialize ErrorTracer               |
| active()          | Function | __none__                             | Activate ErrorTracer (default: true) |
| deactive          | Function | __none__                             | Deactivate ErrorTracer               |
| history           | Array[Object]    | __none__                             | ErrorTracer History                  |

### Parameters for init
| Name        | Type          | description                                                | Example                                                   |
|-------------|---------------|------------------------------------------------------------|-----------------------------------------------------------|
| triggers     | Array[String] | Error events will be observed. default `['error', 'unhandledrejection', 'rejectionhandled']` | `['my_custome_error1', 'other_error']`       |
| callback    | Function      | callback function for errorItem                            | `function(e) { console.log("ErrorTracer Catch:" ,e); }`   |
| apiURL      | String        | if assigned, errorItem will be passed                      | "https://zapier..."                                       |
| sourceRange | Integer       | The range of source code will be captured at around error  | 30 (Above 15 lines and Below 15 lines)                    |
| ignores      | Array[String] | Error message will be ignored in ErrorTracer               | ["Custom_Error1", Customer_Error2"]  


## ErrorTracer will capture below information
Below errorItem will be passed to callback/apiURL.

| Name        | Type          | Description                                                         |
|-------------|---------------|---------------------------------------------------------------------|
| errorId     | String        | Unique Error Id                                                     |
| clientId    | String        | Unique Client Id                                                    |
| error       | Object        | Original Error Event Object                                         |
| location    | String        | Location which error occurred                                       |
| source      | Array[Object] | Source code around of error. Object contains 'lineNo' and 'content' |
| errorLineNo | Integer       | Line number of source code                                          |
| environment | Object        | navigator, localStorage, sessionStorage, cookie                     |
| timeStamp   | Time          | Date.now()                                                          |

## ErrorTracer History
```
const errorTracer = new ErrorTracer(function(errorItem) {
  console.log("error occured: ", errorItem);
});

// history, result is array
console.log(errorTracer.history);
```

## Example #1 (Send ZapierWebHook)
You can easily collect error with [Zapier](https://zapier.com).
Trigger with "Catch Hook" and make action like "Send Gmail".
```
<script>
  document.querySelector("#triggerError")
    .addEventListener("click", function () {
      notExist(); // make Error
    });

  const url = "http://xxxx..."; // Your Zapier Webhook URL

  new ErrorTracer({
    apiURL: url,
  });

  // or simpley
  new ErrorTracer(url);
</script>
```
![zapier](https://user-images.githubusercontent.com/25057349/41698810-5814cc52-755b-11e8-8226-b1787d7b9f69.png)

Now when Error occured, you can get report via Gmail about the error.



## Author
devjiro76@gmail.com



## License
MIT
