library(shiny)

ui <- fluidPage(
  tags$head(
    tags$script(src = "inccsv.browser.js"),
    tags$script(src = "inc-shiny.js")
  ),
  titlePanel("IncCSV.js in Shiny"),
  sidebarLayout(
    sidebarPanel(
      fileInput(
        "inc_upload",
        "Choose an INC or CSV file",
        accept = c(".inc", ".csv", "text/csv", "text/plain")
      ),
      tags$hr(),
      tags$p("Or edit the sample text and parse it in the browser."),
      tags$textarea(
        id = "inc_text",
        class = "form-control",
        rows = 16,
        paste(
          "---",
          "title = Sensor readings",
          "version = 1",
          "[columns]",
          "time = seconds",
          "temperature = Celsius",
          "---",
          "time,temperature",
          "0,21.4",
          "1,21.8",
          "2,22.1",
          sep = "\n"
        )
      ),
      br(),
      actionButton("parse_inc", "Parse INC text", class = "btn-primary")
    ),
    mainPanel(
      h3("Parse status"),
      verbatimTextOutput("status"),
      h3("Metadata"),
      verbatimTextOutput("metadata"),
      h3("Rows"),
      tableOutput("rows")
    )
  )
)

server <- function(input, output, session) {
  parsed <- reactiveVal(NULL)
  parse_error <- reactiveVal(NULL)

  observeEvent(input$inc_file, {
    parsed(input$inc_file)
    parse_error(NULL)
  })

  observeEvent(input$inc_error, {
    parse_error(input$inc_error)
    parsed(NULL)
  })

  output$status <- renderText({
    if (!is.null(parse_error())) {
      return(parse_error())
    }
    file <- parsed()
    if (is.null(file)) {
      return("No INC file has been parsed yet.")
    }
    sprintf(
      "Parsed %s row(s), %s column(s).",
      length(file$rows),
      length(file$columns)
    )
  })

  output$metadata <- renderPrint({
    file <- parsed()
    if (is.null(file)) {
      return(invisible(NULL))
    }
    str(file$metadata)
  })

  output$rows <- renderTable({
    file <- parsed()
    if (is.null(file) || length(file$rows) == 0) {
      return(NULL)
    }

    columns <- unlist(file$columns, use.names = FALSE)
    rows <- lapply(file$rows, function(row) {
      values <- lapply(columns, function(column) {
        value <- row[[column]]
        if (is.null(value)) "" else as.character(value)
      })
      names(values) <- columns
      values
    })

    as.data.frame(do.call(rbind, rows), stringsAsFactors = FALSE)
  })
}

shinyApp(ui, server)
