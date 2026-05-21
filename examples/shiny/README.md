# IncCSV.js Shiny Example

This example shows how an R Shiny app can use the IncCSV.js browser bundle to
parse INC files in the browser and send the parsed result to Shiny.

## Build The Browser Bundle

From the `IncCSV.js` package root:

```sh
npm install
npm run build
```

The build also copies `dist/inccsv.browser.js` into this example's `www/`
directory so the app can serve it like an ordinary Shiny asset.

## Run The App

From this directory:

```sh
R -e 'shiny::runApp(".")'
```

Or from R:

```r
shiny::runApp("/home/matt/Dropbox/src/INC/IncCSV.js/examples/shiny")
```

## Data Flow

1. `app.R` loads `www/inccsv.browser.js` and `www/inc-shiny.js`.
2. Browser JavaScript reads uploaded files with `FileReader` or parses the text
   area contents.
3. `window.IncCSV.parseInc(text)` returns `{ metadata, columns, rows }`.
4. `Shiny.setInputValue("inc_file", parsed, { priority: "event" })` sends the
   parsed object to the Shiny server.
5. The Shiny server renders metadata and rows using ordinary R outputs.

For production Shiny apps, copy a versioned browser bundle into the app's
`www/` directory or serve it from the package/repository asset path you control.
