/* global tableau reqwest */

(function() {
    // Dark Sky API Key
    var API_KEY = "c5a50d083981d1ecad8c5b22c76d2762";
    
    // Schema for data to get from Dark Sky JSON
    var cols = [{
            id: "time",
            dataType: tableau.dataTypeEnum.datetime
        }, {
            id: "summary",
            alias: "summary",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "precipProbability",
            alias: "precipProbability",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "humidity",
            alias: "humidity",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "pressure",
            alias: "pressure",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "cloudCover",
            alias: "cloudCover",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "visibility",
            alias: "visibility",
            dataType: tableau.dataTypeEnum.int
        }, {
            id: "temperature",
            alias: "temperature",
            dataType: tableau.dataTypeEnum.float
        }];
    
    // Create the connector object
    var connector = tableau.makeConnector();

    // Define schema
    connector.getSchema = function(schemaCallback) {
        var tableSchema = {
            id: "darkskyData",
            alias: "Forecast data from Dark Sky",
            columns: cols
        };

        schemaCallback([tableSchema]);
    };

    // Download and format data
    connector.getData = function(table, doneCallback) {
        reqwest({
            url: `https://api.darksky.net/forecast/${API_KEY}/45.535122,-122.948361`,
            type: "jsonp",
            success: resp => {
                // Combine hourly and daily data
                let data = resp.hourly.data.concat(resp.daily.data);
                let tableData = [];
                
                // Format data as necessary
                for (let item of data) {
                    let obj = {};
                    
                    // Cycle through data and pick out pieces in schema
                    for (let attributeToAdd of cols) {
                        if (attributeToAdd.id == "time") {
                            // Create formatted DateTime object for Tableau
                            let tobj = new Date(item[attributeToAdd.id] * 1000);
                            obj[attributeToAdd.id] = tobj.toLocaleDateString() + " " + tobj.toLocaleTimeString();
                        } else if (attributeToAdd.id == "temperature") {
                            // Average temperature if not included in Dark Sky
                            if (Object.keys(item).includes("temperature")) {
                                obj[attributeToAdd.id] = item[attributeToAdd.id];
                            } else {
                                obj[attributeToAdd.id] = (item["temperatureMax"] + item["temperatureMin"]) / 2;
                            }
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
