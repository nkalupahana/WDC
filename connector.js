/* global tableau reqwest */

(function() {
    // Dark Sky API Key
    var API_KEY = "c5a50d083981d1ecad8c5b22c76d2762";
    // Location of forecast (currently KHIO)
    var LOCATION = "45.535122,-122.948361";
    
    /* Schema for data to get from Dark Sky JSON */
    // id: attribute in Dark Sky JSON
    // alias: name of data value in Tableau table
    // dataType: Data type of value (see all at https://tableau.github.io/webdataconnector/docs/api_ref.html#webdataconnectorapi.datatypeenum)
    var cols = [{
            id: "time",
            alias: "Time",
            dataType: tableau.dataTypeEnum.datetime
        }, {
            id: "summary",
            alias: "Summary",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "precipProbability",
            alias: "Precipitation Probability",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "precipIntensity",
            alias: "Precipitation Intensity",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "precipType",
            alias: "Precipitation Type",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "temperature",
            alias: "Temperature",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "apparentTemperature",
            alias: "Apparent Temperature",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "dewPoint",
            alias: "Dew Point",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "humidity",
            alias: "Humidity",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "pressure",
            alias: "Pressure",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "windSpeed",
            alias: "Wind Speed",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "windGust",
            alias: "Wind Gust",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "windBearing",
            alias: "Wind Bearing",
            dataType: tableau.dataTypeEnum.int
        }, {
            id: "cloudCover",
            alias: "Cloud Cover",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "uvIndex",
            alias: "UV Index",
            dataType: tableau.dataTypeEnum.int
        }, {
            id: "visibility",
            alias: "Visibility",
            dataType: tableau.dataTypeEnum.int
        }];
    
    // Create the connector object
    var connector = tableau.makeConnector();

    // Define schema
    connector.getSchema = surfaceSchema => {
        /* Create schema with columns & some other attributes */
        // alias: Name of Data Source in Tableau
        var tableSchema = {
            id: "darkskyData",
            alias: "Weather",
            columns: cols
        };

        // Surface schema to Tableau
        surfaceSchema([tableSchema]);
    };

    // Download and format data
    connector.getData = (table, done) => {
        // Get data (gets 7-day hourly forcast (extended); excludes all other data)
        // Format: JSON-P (circumvents Cross-Origin exceptions)
        reqwest({
            url: `https://api.darksky.net/forecast/${API_KEY}/${LOCATION}?extend=hourly&exclude=currently,minutely,daily,alerts,flags`,
            type: "jsonp",
            success: resp => {
                // Full table data storage
                let tableData = [];
                
                // Format data as necessary
                for (let item of resp.hourly.data) {
                    let obj = {};
                    
                    // Cycle through data and pick out pieces in schema
                    for (let attributeToAdd of cols) {
                        if (attributeToAdd.id == "time") {
                            // Create formatted DateTime object for Tableau
                            let tobj = new Date(item[attributeToAdd.id] * 1000);
                            obj[attributeToAdd.id] = tobj.toLocaleDateString() + " " + tobj.toLocaleTimeString();
                        } else {
                            // Move the attribute over
                            obj[attributeToAdd.id] = item[attributeToAdd.id];
                        }
                    }
                    
                    // Save the formatted data object
                    tableData.push(obj);
                }
                
                // Send data to Tableau and mark as complete
                table.appendRows(tableData);
                done();
            }
        });
    };

    // Surface connector to tableau library
    tableau.registerConnector(connector);
    
    // Run ready() when everything is loaded
    if (document.readyState != 'loading'){
        ready();
    } else {
        document.addEventListener('DOMContentLoaded', ready);
    }


    // Create event listener for when user requests data
    function ready() {
        document.getElementById("submitButton").addEventListener("click", () => {
            // Set data source name
            tableau.connectionName = "Dark Sky Connector";
            // Submit connector to Tableau
            tableau.submit();
        });
    }
    
})();