/* global tableau $ */

(function() {
    var API_KEY = "c5a50d083981d1ecad8c5b22c76d2762";
    
    var cols = [{
            id: "time",
            dataType: tableau.dataTypeEnum.int
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
    var myConnector = tableau.makeConnector();

    // Define the schema
    myConnector.getSchema = function(schemaCallback) {
        var tableSchema = {
            id: "darkskyData",
            alias: "Forecast data from Dark Sky",
            columns: cols
        };

        schemaCallback([tableSchema]);
    };

    // Download the data
    myConnector.getData = function(table, doneCallback) {
        $.getJSON(`https://api.darksky.net/forecast/${API_KEY}/45.535122,-122.948361`, function(resp) {
           let data = resp.hourly.data.concat(resp.daily.data);
           let tableData = {};
           
            for (let item of data) {
                let obj = {};
                
                for (let attributeToAdd of cols) {
                    obj[attributeToAdd.id] = item[attributeToAdd.id];
                }

                tableData.push(obj);
            }

            table.appendRows(tableData);
            doneCallback();
        });
    };

    tableau.registerConnector(myConnector);

    // Create event listeners for when the user submits the form
    $(document).ready(function() {
        $("#submitButton").click(function() {
            tableau.connectionName = "Dark Sky Connector"; // This will be the data source name in Tableau
            tableau.submit(); // This sends the connector object to Tableau
        });
    });
})();
