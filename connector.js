/* global tableau reqwest */

(function() {
    // Dark Sky API Key
    var API_KEY = "c5a50d083981d1ecad8c5b22c76d2762";
    
    // Schema for data to get from Dark Sky JSON
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
    connector.getSchema = function(schemaCallback) {
        var tableSchema = {
            id: "darkskyData",
            alias: "Weather",
            columns: cols
        };

        schemaCallback([tableSchema]);
    };

    // Download and format data
    connector.getData = function(table, doneCallback) {
        reqwest({
            url: `https://api.darksky.net/forecast/${API_KEY}/45.535122,-122.948361?extend=hourly&exclude=currently,minutely,daily,alerts,flags`,
            type: "jsonp",
            success: resp => {
                // Combine hourly and daily data
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
                            obj[attributeToAdd.id] = item[attributeToAdd.id];
                        }
                    }
                    
                    tableData.push(obj);
                }
                
                // Send data to Tableau and mark as complete
                table.appendRows(tableData);
                doneCallback();
            }
        });
    };

    tableau.registerConnector(connector);
    
    // Register event listener on ready
    if (document.readyState != 'loading'){
        ready();
    } else {
        document.addEventListener('DOMContentLoaded', ready);
    }


    // Create event listener for when user requests data
    function ready() {
        document.getElementById("submitButton").addEventListener("click", () => {
            // Set data source name and send to Tableau
            tableau.connectionName = "Dark Sky Connector";
            tableau.submit();
        });
    }
    
})();
