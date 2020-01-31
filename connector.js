/* global tableau reqwest */

(function() {
    var API_KEY = "c5a50d083981d1ecad8c5b22c76d2762";
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

    // Define the schema
    connector.getSchema = function(schemaCallback) {
        var tableSchema = {
            id: "darkskyData",
            alias: "Forecast data from Dark Sky",
            columns: cols
        };

        schemaCallback([tableSchema]);
    };

    // Download the data
    connector.getData = function(table, doneCallback) {
        reqwest({
            url: "https://api.darksky.net/forecast/c5a50d083981d1ecad8c5b22c76d2762/45.535122,-122.948361",
            type: "jsonp",
            success: resp => {
                let data = resp.hourly.data.concat(resp.daily.data);
                let tableData = [];
                
                for (let item of data) {
                    let obj = {};
                    
                    for (let attributeToAdd of cols) {
                        if (attributeToAdd.id == "time") {
                            let tobj = new Date(item[attributeToAdd.id] * 1000);
                            obj[attributeToAdd.id] = tobj.toLocaleDateString() + " " + tobj.toLocaleTimeString();
                        } else if (attributeToAdd.id == "temperature") {
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
                
                table.appendRows(tableData);
                doneCallback();
            }
        });
    };

    tableau.registerConnector(connector);
    
    if (document.readyState != 'loading'){
        ready();
    } else {
        document.addEventListener('DOMContentLoaded', ready);
    }


    // Create event listeners for when the user submits the form
    function ready() {
        document.getElementById("submitButton").addEventListener("click", () => {
            tableau.connectionName = "Dark Sky Connector"; // This will be the data source name in Tableau
            tableau.submit(); // This sends the connector object to Tableau
        });
    }
    
})();
