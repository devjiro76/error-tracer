# Error-Tracer

Error-Tracer will help to trace client errors.

![ErrorTracer](https://user-images.githubusercontent.com/25057349/41692482-88432d6c-753b-11e8-9493-07a22aa3c6d6.png)

1. **Collect client error.**  
Our users don't report an error.

2. **Capture the source code when error occurred.**  
Sometimes our source codes are overwrittren. So it makes difficult to recognize what was the problem.

3. **Capture the user environment when error occurred.**  
What was the user browser?
What did user has data in local/sessionStorage or cookie?
What time was error occurred?


## Install
```
npm install --save error-tracer
yarn add -D error-tracer
```
or browser
```
<script src="https://unpkg.com/error-tracer@0.1.6/dist/errortracer.bundle.js"></script>
```

## Import
```
import ErrorTracer from 'error-tracer';
const ErrorTracer = require('error-tracer');
```
or browser
```
<script src="https://unpkg.com/error-tracer@0.1.6/dist/errortracer.bundle.js"></script>
```

## Usage
1. with Construct
```
// object
new ErrorTracer({
  callback: function(e) { console.log(1, e) },
  apiURL: "http://aaa.com",
  sourceRange: 30, // line range will be captured (default: 10)
  ignore: "error_message"
  // ignore: ["error_message1", "error_message1"]
});

// callback (function)
new ErrorTracer(function (errorItem) {
  console.error("this is handled by error-tracer", errorItem);
});

// apiURL (string)
new ErrorTracer("http://xxx.com..."); // ErrorTracer Item will be posted

```
3. with init method
```
// same with construct
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
| history           | Array    | __none__                             |                                      |

### Parameters of init
| Name        | Type          | description                                                | Example                                                   |
|-------------|---------------|------------------------------------------------------------|-----------------------------------------------------------|
| callback    | Function      | callback function for errorItem                            | `function(e) { console.log("ErrorTracer Catch:" ,e); }` |
| apiURL      | String        | if assigned, errorItem will be passed                      | "https://zapier..."                                       |
| sourceRange | Integer       | The range of source code will be captured at around error  | 30 (Above 15 lines and Below 15 lines)                    |
| ignore      | Array[String] | Error message will be ignored in ErrorTracer               | ["Custom_Error1", Customer_Error2"]  


## ErrorTracer will capture
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

## Example#1 (Send ZapierWebHook)
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

Now when Error occured, you can get report the error.



## Author
devjiro76@gmail.com



## License
MIT
