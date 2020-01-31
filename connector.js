/* global tableau reqwest */

(function() {
    // Schema for data to get from NWS GeoJSON
    var cols = [{
            id: "validTime",
            alias: "Time",
            dataType: tableau.dataTypeEnum.datetime
        }, {
            id: "temperature",
            alias: "Temperature",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "relativeHumidity",
            alias: "Humidity",
            dataType: tableau.dataTypeEnum.float
        }, {
            id: "dewpoint",
            alias: "dewPoint",
            dataType: tableau.dataTypeEnum.float
        }];
    
    // Create the connector object
    var connector = tableau.makeConnector();

    // Define schema
    connector.getSchema = function(schemaCallback) {
        var tableSchema = {
            id: "nwsData",
            alias: "Forecast data from the NOAA National Weather Service",
            columns: cols
        };

        schemaCallback([tableSchema]);
    };

    // Download and format data
    connector.getData = function(table, doneCallback) {
        reqwest({
            url: `https://api.weather.gov/gridpoints/PQR/103,106`,
            crossOrigin: true,
            success: resp => {
                // Combine hourly and daily data
                let data = resp.properties;
                let tableData = [];
                
                // Format data as necessary
                for (let col of cols) {
                    if (col.id == "validTime") {
                        continue;
                    }
                    
                    for (let value of data[col.id]["values"]) {
                        let tobj = new Date(value.validTime.split("/")[0]);
                        let tstring = tobj.toLocaleDateString() + " " + tobj.toLocaleTimeString();
                        
                        let index = tableData.findIndex(obj => {
                           return obj.validTime == tstring; 
                        });
                        
                        if (index == -1) {
                            tableData.push({
                                validTime: tstring
                            });
                            
                            index = tableData.findIndex(obj => {
                               return obj.validTime == tstring;
                            });
                        }
                        
                        tableData[index][col.id] = value.value;
                    }
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
            tableau.connectionName = "NWS Connector";
            tableau.submit();
        });
    }
    
})();
