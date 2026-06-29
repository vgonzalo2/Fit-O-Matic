// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
// $(function() {}) equivalent to $().ready(()=>{});

// References: MDN Web Docs - https://developer.mozilla.org/en-US/docs/Web/API/

// UploadPreset variables
imgLoading = false;     // bool to acknowledge loading a single clothing image at a time

// for GetPreset() success section
presetImages = [];      
presetNames = [];
presetIDs = [];
presetCategoryIDs = [];

let intervalID;             // stored polling interval ID
let prevID = 0;             // previous preset ID
let pollingActive = true;   // flag to check if polling active
let currentPresetIndex = 0; // current index for browsing

// for publishing mode
//let projectURL = "https:...";

// for Debugger mode
//let projectURL = "http:...";

$(function() {
    console.log("On page load");

    // if the current page is the home page
    if (window.location.pathname === '/') {

        // display the weather from the database
        GetWeatherFromDB();

        // get all current presets
        GetPresets();

        // set target time at around 9:00 AM
        const targetHour = 9;          // 9 AM (24-hour format)     
        const targetMinute = 0;        // 0 mins

        // get how much to delay until next call
        const delay = timeTilNextCall(targetHour, targetMinute);

        // schedule a function that will make a api Call at the same time every 24 hours
        setTimeout(function () {
            GetEDMWeather();
            console.log('update');
            // 1 hour = 3.6E6 ms, so 24 hours * 3.6E6 = 86400000 ms
            setInterval(GetEDMWeather, 86400000);
        }, delay);

        // initial startPolling for changes on the current preset to be shown
        startPolling();
    }
   
    // Will change to update the WeatherInfo table in the database at a setinterval
    //$("#getInfo").on("click", GetEDMWeather); // Get Info about Edmonton's weather on button click

    let dropArea = $("#drop-area");

    // References: Drag Drop API https://developer.mozilla.org/en-US/docs/Web/API/DragEvent/dataTransfer
    // assign the dropArea div to only accept image files
    dropArea.attr("accept", "image/*");

    // Prevent default behaviour (prevent opening file)
    dropArea.on("dragenter dragover dragleave drop", function (e){
        e.preventDefault();     
        e.stopPropagation();       
    });

    // highlight drop area when item is dragged over it
    dropArea.on("dragenter, dragover", function () {
        dropArea.addClass("highlight");        
    });

    dropArea.on("dragleave drop", function () {
        dropArea.removeClass("highlight")
    });

    // drop event to call fileHandling function
    dropArea.on("drop", function (e) {
        if (imgLoading) {
            alert("Please wait until the current image is loaded in.");
            return;
        }

        let dataObject = e.originalEvent.dataTransfer;  // contains the drag event's data

        // if the data transfer object is not null
        // pass the files of the object to the fileHandling() function
        if (dataObject != null) {
            let files = dataObject.files;          
            fileHandling(files);
        }
    });

    // input event is when the user selected a file to open
    $("#selectFileBtn").on("change", function () {
        console.log("Selected a file to open");

        // obtain the file list property, if its not empty
        if (this.files[0]) {
            fileList = $("#selectFileBtn")[0].files;
            console.log($("#selectFileBtn"));
            console.log(fileList);

            // should only obtained 1 image
            displayImgPreview(fileList[0]);
        }
        else {
            console.log("no file was selected"); // display if none was selected in console
        }
    });

    // upload preset submission button click
    $("#uploadBtn").on("click", AddPreset);

    // cancel preset submission btn
    $("#cancelBtn").on("click", function () {
        console.log("Cancel clothing preset submission");

        // hide preview area
        $("#clothing-preview").attr("src", "");  
        $("#preview-area").hide();

        // set the value of the hidden field, presetname textbox 
        // and the select file button to empty string
        $("#fileBase64String").val("");
        $("#preset-name").val("");
        $("#selectFileBtn").val("");

        $("#messageStatus").text("Cancel clothing preset submission");
        //console.log($("#fileBase64String").val());
    });

    // next preset button click event, browse to the next preset
    $("#nextPresetBtn").on("click", function () {
        browsePreset(currentPresetIndex + 1);
    });

    // prev preset button click event, browse to the previous preset
    $("#prevPresetBtn").on("click", function () {
        browsePreset(currentPresetIndex - 1);
    });

    // restart polling for the Microcontroller's input 
    $("#restartPollingBtn").on("click", function () {
        startPolling();     // restart polling
    });    
});

// start polling
function startPolling() {
    // clear any existing interval
    if (!intervalID) {
        clearInterval(intervalID);
    }

    // set the pollingActive to true, and set a new interval 
    // to get the current preset every 10 s
    pollingActive = true;
    intervalID = setInterval(getCurrentPreset, 10000);
}

// stop polling
function stopPolling() {
    if (intervalID) {
        clearInterval(intervalID);  // stops the current polling interval
        pollingActive = false;      // set the flag to false
    }
}

// method to be called polling for the current preset the Microcontroller scanned
function getCurrentPreset() {
    if (!pollingActive) return; // don't run if not in polling mode

    // when DEBUGGING make sure its http and not https!
    // http for local running, https for published websites
    ServerAJAX(projectURL + "api/currentpreset",
        "get",
        undefined,
        "json",
        function (response, status) {
            console.log(response);

            console.log($("#presetStatus").val() + " != " + response["presetID"] + ` ${$("#presetStatus").val() != response["presetID"]}`);

            if ($("#presetStatus").val() != response["presetID"]) {

                console.log("New Preset loaded: " + response["presetID"]);               
                let index = presetIDs.indexOf(response["presetID"]);

                console.log(index);

                displayCurrentPreset(response["presetID"], presetNames[index], presetImages[index], mapCategories[presetCategoryIDs[index]]);              
            }
        },
        Error
    );
}

// takes in a id, name, and image base 64string to display preset info
function displayCurrentPreset(id, name, image, category) {
    console.log("ID: " + id);
    $("#presetStatus").val(id);
    $("#presetID").text("ID: " + id);
    $("#presetName").text(name);
    $("#presetCategory").text("Wear: " + category);
    $("#imagePresetDisplay").attr("src", image);
    $("#imagePresetDisplay").attr("alt", name);
}

// method to take an int input from a button click (from next or prev button click)
function browsePreset(index) {
    stopPolling();  // stop polling while manually browsing

    // loop around if the index exceeds the bounds
    currentPresetIndex = (index + presetIDs.length) % presetIDs.length;

    displayCurrentPreset(presetIDs[currentPresetIndex], presetNames[currentPresetIndex], presetImages[currentPresetIndex], mapCategories[presetCategoryIDs[currentPresetIndex]]);
}

// Map the categoryIDs to their respective category name
const mapCategories = {
    1: "Casual",
    2: "Formal",
    3: "Snow",
    4: "Rain",
    5: "Sunny"
}

// assign the weather codes to the weather interpretation strings
// Consider using AiryCon images from GitHub for the weathercode symbols
// References IMAGES FROM HaroleDev/AiryCons: https://github.com/HaroleDev/Airycons/tree/main
const weatherCodes = {
    0: "Clear Sky",
    1: "Mainly clear",
    2: "Partly Cloudy",
    3: "Overcast",

    45: "Fog",
    48: "Rime Fog",

    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",

    56: "Light Freezing Drizzle",
    57: "Dense Freezing Drizzle",

    61: "Light Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",

    66: "Slight Freezing Rain",
    67: "Heavy Freezing Rain",

    71: "Slight Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",

    77: "Snow Grains",
    80: "Slight Rain Shower",
    81: "Moderate Rain Shower",
    82: "Violent Rain Shower",
    85: "Slight Snow Shower",
    86: "Heavy Snow Shower",
};

/**********************************************************************************************************/
/// Description: Get Edmonton's weather and to make sense of the OpenMeteo's documentation.             
/// Params: None
/// Returns: N/A
/**********************************************************************************************************/
function GetEDMWeather() {
    console.log("Inside GetWeather: ");

    let url = "https://api.open-meteo.com/v1/forecast"; // ?latitude=52.52&longitude=13.41&hourly=temperature_2m/";

    // create the data object to retrieve weather information
    let data = {};
    data['latitude'] = 53.5461;
    data['longitude'] = -113.4937;
    data['elevation'] = '645';
    data['hourly'] = "temperature_2m,weather_code,precipitation_probability,is_day";
    data['timezone'] = "America/Edmonton";
    data['current'] = "temperature_2m,is_day,weather_code,precipitation_probability";
   /* data['daily'] = "apparent_temperature_max,sunrise,sunset";*/

    AJAX(url, "get", data, "JSON", WeatherSuccess, Error);     // make AJAX call to openmeteo weather api
}

/**********************************************************************************************************/
/// Description: Takes in a int for weathercode and a int for day = 1 and night = 0.
///              Returning the forecasted weather's image pathname.
/// Params: weather_code - int that tells the type of weather.
///         dayNight - int that determines the time of day the image should be.
/// Returns: The forecasted weather's image pathname.
/**********************************************************************************************************/
function SelectImage(weather_code, dayNight) {
    let baseImage = 'images/';
    let time = " ";

    if (dayNight)
        time = "Day";
    else
        time = "Night";

    switch (weather_code) {
        case 0: baseImage += `NormalConditions/${time}/Clear@4x.png`;
            break;
        case 1: baseImage += `NormalConditions/${time}/Mostly Clear@4x.png`;
            break;
        case 2: baseImage += `NormalConditions/${time}/Partly Cloudy@4x.png`;
            break;
        case 3: baseImage += `NormalConditions/${time}/Overcast@4x.png`;
            break;
        case 45: baseImage += `FogTypes/${time}/Fog@4x.png`;
            break;
        case 48: baseImage += `FogTypes/${time}/Rime Fog@4x.png`;
            break;
        case 51: baseImage += `${time}Drizzle/Light Drizzle@4x.png`;
            break;
        case 53: baseImage += `${time}Drizzle/Moderate Drizzle@4x.png`;
            break;
        case 55: baseImage += `${time}Drizzle/Dense Drizzle@4x.png`;
            break;
        case 56: baseImage += `${time}Drizzle/Light Freezing Drizzle@4x.png`;
            break;
        case 57: baseImage += `${time}Drizzle/Dense Freezing Drizzle@4x.png`;
            break;
        case 61: baseImage += `Rain/${time}/Light Rain@4x.png`;
            break;
        case 63: baseImage += `Rain/${time}/Moderate Rain@4x.png`;
            break;
        case 65: baseImage += `Rain/${time}/Heavy Rain@4x.png`;
            break;
        case 66: baseImage += `Rain/${time}/Light Freezing Rain@4x.png`;
            break;
        case 71: baseImage += `Rain/${time}/Heavy Freezing Rain@4x.png`;
            break;
        case 73: baseImage += `SnowFall/${time}/Slight SnowFall@4x.png`;
            break;
        case 75: baseImage += `Snowfall/${time}/Moderate SnowFall@4x.png`;
            break;
        case 77: // No Night Heavy SnowFall image and no Snow Shower images
            break;
        case 80:
            break;
        case 81:
            break;
        case 82:
            break;
        case 85:
            break;
        case 86:
            break;
    }

    return baseImage; // return the pathname
}

/**********************************************************************************************************/
/// Description: Takes in the retrieved JSON data from the AJAX call and response status.
///              Manipulate the JSON data for display on the html.            
/// Params: ajaxData - JSON data weather object 
///         responseStatus - the response status of whether method is executed correctly
/**********************************************************************************************************/
// success function to manipulate ajax return data back
function WeatherSuccess(ajaxData, responseStatus) {
    console.log("Successful ajax call");

    if (ajaxData.Length != 0)
    {
        // empty the container before updating info
        $("#currentInfo").empty();
        $("#hourlyLane").empty();

        // hourly data retrieved starts at 00:00 (hour 0) upto 168 hours 
        console.log(ajaxData);

        // format the time
        const timeOptions = {
            hour: 'numeric',
            hour12: true    // Enable 12-hour format
        };

        // ajax['hourly'] is formatted in 24-hour MDT format and starts at 0 upto 168 hours (7 days)
        // get the current hour and use it as the indexer through the arrays
        let dateTime = new Date();
        let hourVal = dateTime.getHours();
        console.log(hourVal);

        let hourlyArray = ajaxData['hourly'];   // hourlyArray of weather values IMPORTANT

        // display current hour temperature
        $("#currentInfo").append(`${Math.round(ajaxData['current']['temperature_2m'])} ${ajaxData['current_units']['temperature_2m']} ${weatherCodes[hourlyArray['weather_code'][hourVal]]}`);

        // create the table object
        let table = $("<table id=hourlyTable>");
        table.addClass('table table-bordered');

        let tableHeader = $("<thead></thead>");
        // create the timeRow and the tempRow
        let headerRow = $("<tr></tr>");
        tableHeader.append(headerRow);

        let tableBody = $("<tbody></tbody>");
        let tempRow = $("<tr></tr>");
        tableBody.append(tempRow);

        // want to make table cells from the next hour upto 24 hours
        for (let index = hourVal + 1; index <= hourVal + 24; index++) {
            // create a new Date() object using the datetime string at the index
            // format to 12-hour time and append the time cell into the tempRow 
            // References: GeeksforGeeks - https://www.geeksforgeeks.org/how-do-you-display-javascript-datetime-in-12-hour-am-pm-format/
            let thisDate = new Date(hourlyArray['time'][index]);
            let timeString = thisDate.toLocaleTimeString('en-US', timeOptions);
            let timeCell = $(`<th>${timeString}</th>`);
            let tempCell = $(`<td>${Math.round(hourlyArray['temperature_2m'][index])}${'&deg'}</td>`);

            // console.log(hourlyArray['weather_code'][index]);

            // add the image to an img tag as the src and append it to the current row
            let image = SelectImage(hourlyArray['weather_code'][index], hourlyArray['is_day'][index]);
            tempCell.append(`<img src="${image}" alt="weather"></img>`);
            tempCell.append(`\r\n${hourlyArray['precipitation_probability'][index]}%`);

            // timeCells and tempCells into their respective rows
            headerRow.append(timeCell);
            tempRow.append(tempCell);
        }

        // append the tableHeader, then the tableBody. headerRow first, then the tempRow to the table
        table.append(tableHeader);
        table.append(tableBody);
        console.log(table);

        // append the table into the hourlyLane container
        $("#hourlyLane").append(table);

        // call UpdateWeatherInfo to send the hourly array data to the database
        UpdateWeatherInfo(hourlyArray);
    }
}

/**********************************************************************************************************/
/// Description: Makes an ajax call to the server to reupdate the database with the hourly weatherdata from the API Call.
/// Params: hourlyArray - the weather data for the current week in an object of arrays.
/**********************************************************************************************************/
// notify Server to update the weather info table
function UpdateWeatherInfo(hourlyArray)
{
    if(hourlyArray.Length != 0)
    {    
        // split the arrays within the hourly object into separate arrays
        let weatherData = {};
        weatherData["action"] = "ReUpdateWeather";
        weatherData["temperature"] = hourlyArray["temperature_2m"];
        weatherData["precipitation"] = hourlyArray["precipitation_probability"];
        weatherData["time"] = hourlyArray["time"];
        weatherData["weather_code"] = hourlyArray["weather_code"];
        weatherData["is_day"] = hourlyArray["is_day"];

        // make a Post server ajax call
        ServerAJAX(projectURL + "ReUpdateWeather", "post", weatherData, "JSON", ServerSuccess, Error);
    }
}

/**********************************************************************************************************/
/// Description: Onload method makes an ajax call to the Server to display the current weather forecast
///              from now upto 24 hours.
/**********************************************************************************************************/
function GetWeatherFromDB() {
    console.log("Inside GetWeatherFromDB: ");

    let action = "DisplayWeather";

    // create the empty data object to retrieve weather information
    let data = {};   

    // call the server ajax call to get the weather data from the database
    ServerAJAX(projectURL + "DisplayWeather", "GET", data, "JSON", ServerSuccess, Error);    
}


/**********************************************************************************************************/
/// Description: When the upload preset button is clicked, this method will use the required fields 
///              (presetName, categoryID and the image of the preset as a base64String) to make a server call
///              adding these as a preset to the Preset table in the database. 
/**********************************************************************************************************/
function AddPreset()
{
    let presetName = $("#preset-name").val();

    // html is name of outfit wear (formal, etc)
    // id is the corresponding id
    let categoryOutfit = $("#categories option:selected").html();
    let categoryID = $("#categories").val();
    let image64Str = $("#fileBase64String").val();
    console.log("upload button clicked");
    console.log("Preset Name: " + presetName);
    console.log(`Outfit: ${categoryOutfit} typeID: ${categoryID}`);
    console.log(`Image data: ${image64Str}`);

    // only if all the fields were supplied 
    if (presetName.length > 0 && categoryOutfit.length > 0 && categoryID > 0 && image64Str.length > 0) {
        console.log("Allowed");    

        let data = {};
        data["action"] = "AddPreset";
        data["categoryID"] = parseInt(categoryID);
        data["presetName"] = presetName;
        data["image64Str"] = image64Str;        // base64 string will be stored as a Text field in the sql database

        console.log(data);

        // Server AJAX to update database
        ServerAJAX(projectURL + "AddPreset", "post", data, "JSON", ServerSuccess, Error);
    }
}

/*************************************************************************/
/// Description: Takes in 2 params, the targetHour and targetMinute
///              to calculate the time until the target time of day 
///              in which a new API call is made to refresh weatherdata from OpenMeteo.
/// Returns: The time to wait before making another weather API call.
/*************************************************************************/
function timeTilNextCall(targetHour, targetMinute) {
    // get the current Date, and the expected target time as Date objects
    const now = new Date();
    const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, targetMinute, 0, 0);

    // if the target time has passed already, set target to the same time tomorrow
    if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
    }

    // return how long to wait until next API call in milliseconds
    return targetTime - now;
}

/****************************************************************************/
/// Description: Gets all clothing presets from the database through the server.
/****************************************************************************/
// Get all presets onload to be displayed 1 at a time
function GetPresets() {
  
    let data = {};

    ServerAJAX(projectURL + "GetPresets", "get", data, "JSON", ServerSuccess, Error);
}

/******************************************************************************/
/// Description: Takes in a array of files that were dropped in and only takes the first file.
///              Then calls displayImgPreview() if the file was an image.
/******************************************************************************/
// handle a image file to be display and add to the Clothing table
function fileHandling(files) {
    console.log(files);

    // if there is more than 1 file
    if (files.length != 0) {
        let validImgFiles = [];

        // check all files if they are image files
        $.each(files, function (index, file) {

            if (file.type.startsWith("image/")) {
                console.log(`File: ${file.name} is an image.`);
                validImgFiles.push(file);
                return true;                        // only process the first valid image file
            }
            else {
                console.log(`File: ${file.name} is not an image file.`);
                alert("Image files (.png, .jpg, etc) are only allowed.")
            }
        });

        // only display the first image file that was dropped in the drop area
        if (validImgFiles.length > 0) {
            selectedFile = validImgFiles[0];
            displayImgPreview(selectedFile);
        }
    }
}

/******************************************************************************/
/// Description: Takes an image file, converts it to a base64String and
///              displayed it in the preview-area element and store it 
///              in a hidden textbox field.
/******************************************************************************/
// display the current image in the img preview area
function displayImgPreview(imgFile) {
    // create a FileReader object 
    let reader = new FileReader();

    // display the image in the clothing preview area
    reader.onload = function (e) {
        let fileInfoHidden = e.target.result;

        $("#clothing-preview").attr("src", fileInfoHidden);  // show the result (image url) of the FileReader
        $("#preview-area").show();

        $("#fileBase64String").val(fileInfoHidden);

        console.log($("#fileBase64String").val());

        // Reference: https://stackoverflow.com/questions/21227078/convert-base64-to-image-in-javascript-jquery
        // easy way to reconstruct the image from the base64 string (retrieve from database)
        //let image = new Image();
        //image.src = $("#fileBase64String").val();
        //console.log(image);
        //$("#hiddenPreview").append(image);
    };

    reader.onerror = function (e) {
        console.error("FileReader error: " + e);
    }

    // read the File object in which the result attribute contains the file data as data:URL
    reader.readAsDataURL(imgFile);
}

/**********************************************************************************************************/
/// Description: SuccessFunction for any ajax calls to the server (Program.cs file).
///              Processes any ajaxData returned from the server (forecast from now upto 24 hours 
///              was determined in the server).
/**********************************************************************************************************/
// Successful ServerAJAXCall() to update a table
function ServerSuccess(ajaxData, responseStatus)
{
    console.log(ajaxData);
    let action = ajaxData["action"];
    let message = ajaxData["message"];

    if(ajaxData.Length != 0)
    {
        if (action == "DisplayWeather")
        {
            console.log("Retrieved weather data from DB");

            // empty the container before updating info
            $("#currentInfo").empty();
            $("#hourlyLane").empty();

            // format the time
            const timeOptions = {
                hour: 'numeric',
                hour12: true    // Enable 12-hour format
            };

            let temperatureArray = ajaxData["temperature"];
            let precipitationArray = ajaxData["precipitation"]; 
            let weatherCodeArray = ajaxData["weatherCode"];
            let timeArray = ajaxData["time"]; 
            let isDayArray = ajaxData["isDay"];

            // display current hour temperature
            $("#currentInfo").append(`${Math.round(temperatureArray[0])} °C ${weatherCodes[weatherCodeArray[0]]}`);

            // create the table object
            let table = $("<table id=hourlyTable>");
            table.addClass('table table-bordered');

            let tableHeader = $("<thead></thead>");
            // create the timeRow and the tempRow
            let headerRow = $("<tr></tr>");
            tableHeader.append(headerRow);

            let tableBody = $("<tbody></tbody>");
            let tempRow = $("<tr></tr>");
            tableBody.append(tempRow);

            // want to make table cells from the next hour upto 24 hours (the arrays should be contain upto 24 elements)
            for (let index = 1; index < temperatureArray.length; index++) {

                let thisDate = new Date(timeArray[index]);
                // console.log(timeArray[index]);
                let timeString = thisDate.toLocaleTimeString('en-US', timeOptions);

                // console.log(timeString);

                let timeCell = $(`<th>${timeString}</th>`);
                let tempCell = $(`<td>${Math.round(temperatureArray[index])}${'&deg'}</td>`);

                let image = SelectImage(weatherCodeArray[index], isDayArray[index]);
                tempCell.append(`<img src="${image}"></img>`);
                tempCell.append(`\r\n${precipitationArray[index]}%`);

                // timeCells and tempCells into their respective rows
                headerRow.append(timeCell);
                tempRow.append(tempCell);
            }

            // append the tableHeader, then the tableBody. headerRow first, then the tempRow to the table
            table.append(tableHeader);
            table.append(tableBody);
            console.log(table);

            // append the table into the hourlyLane container
            $("#hourlyLane").append(table);
        }

        // display in console that weather data updated to database
        if(action == "ReUpdateWeather")
        {
            console.log(message);          
        }

        // display in console that preset was successfully uploaded
        if(action == "AddPreset" && message.length > 0)
        {
            console.log("Added preset to the database.");
            console.log(message);
            $("#messageStatus").text(message);

            // hide preview area
            $("#clothing-preview").attr("src", "");
            $("#preview-area").hide();

            // set the value of the hidden field, presetname textbox 
            // and the select file button to empty string
            $("#fileBase64String").val("");
            $("#preset-name").val("");
            $("#selectFileBtn").val("");
        }

        // display in the first preset data in a table
        if (action == "GetPresets")
        {
            console.log(message);
            $("#imagePresetDisplay").show();

            // store the arrays with the data from the ajaxData
            presetImages = ajaxData["images"];
            presetNames = ajaxData["presetNames"];
            presetIDs = ajaxData["presetIDs"];
            presetCategoryIDs = ajaxData["categoryIDs"];

            // create a new table for presets
            let presetTable = $("<table id=presetTable>");
            presetTable.addClass("table table-borderless table-responsive");

            // create table header 
            let tableHeader = $("<thead></thead>");
            let headerRow = $("<tr></tr>");
            tableHeader.append(headerRow);

            headerRow.append(`<td id="presetCategory">${mapCategories[presetCategoryIDs[0]]}</td>`);  

            // create the table body, and the image row
            let tableBody = $("<tbody></tbody>");

            let currentRow = $("<tr></tr>");
            currentRow.append(`<td id="editCol"><button id="editBtn">Edit</td>`); // edit button
            
            tableBody.append(currentRow);

            // set the data cell with the preset name and a img element to display its image
            // appending the data cell in the table header, and the img element in the image row 
            console.log(presetImages[0]);
            headerRow.append($(`<td id=presetName></td>`));
            currentRow.append(`<img id="imagePresetDisplay" alt="PresetMissing" src>`);

            headerRow.append('<td id="presetID"></td>');
            currentRow.append('<td id="deleteCol" style="display:flexbox"><button id="deleteBtn">Delete</td>'); // delete button

            // append to the table the table header, and the table body
            presetTable.append(tableHeader);
            presetTable.append(tableBody);
            console.log(presetTable);

            // empty the container before appending the created presetTable
            $("#presetTableContainer").empty().append(presetTable);  
            $("#presetTableContainer").addClass("col-auto");

            // call displayCurrentPreset, passing the first preset's id, name and image string
            displayCurrentPreset(presetIDs[0], presetNames[0], presetImages[0], mapCategories[presetCategoryIDs[0]]);

            $("#editBtn").on("click", EditPreset);

            $("#deleteBtn").on("click", DeleteBtn);                
        }

        // if the action was UpdatePreset or DeletePreset
        if (action == "UpdatePreset" || action == "DeletePreset") 
        {
            console.log(message);

            // refresh the preset arrays in the website calling GetPresets()
            GetPresets();
        }       
    }
}

// when Edit button is clicked, changes the button to Update
// with a UpdatePreset() on click event, add a cancel button to the same data cell
// and changes the PresetName Text field to a textbox with the current PresetName 
function EditPreset()
{
    console.log("Edit button click switch to update button");
    //id = "editCol" data cell

    // disable this edit event
    $(this).off("click");

    $(this).prop("id", "updateBtn");

    $(this).text("Update");

    $(this).on("click", UpdatePreset);

    $("#editCol").append(`<button id="cancelBtn">Cancel</button>`);

    $("#cancelBtn").on("click", CancelBtn);

    console.log($("#presetName"));

    let currentName = $("#presetName").text();

    $("#presetName").text();

    $("#presetName").append($(`<input id="presetTBX" type="text" value="${currentName}"></input>`));
}

function UpdatePreset()
{
    console.log("Update btn clicked");

    let presetName = $("#presetTBX").val();
    console.log("Updated preset name saved " + presetName);
    console.log($("#presetStatus").val());

    let updateData = {};
    updateData["presetID"] = $("#presetStatus").val();
    updateData["presetName"] = presetName; 

    console.log(updateData);

    // ServerAJAX  
    ServerAJAX(projectURL + "UpdatePreset", "post", updateData, "json", ServerSuccess, Error);

    // after call reset back to editBtn functionality
    $(this).off();

    $(this).prop("id", "editBtn");

    $(this).text("Edit");

    $(this).on("click", EditPreset);

    $("#cancelBtn").remove();

    $("#presetTBX").remove();   // remove the textbox
}

function CancelBtn()
{
    console.log("Cancel btn clicked");  

    // change the Update button back to editBtn functionality
    $("#updateBtn").off();

    $("#updateBtn").attr("id", "editBtn");

    $("#editBtn").text("Edit");

    $("#editBtn").on("click", EditPreset);

    $("#presetTBX").remove(); // remove the textbox

    // turn off the cancel event, remove this button
    //$(this).off();
    $(this).remove();
}

function DeleteBtn()
{
    console.log("Delete button switch");
    //id = "deleteCol" data cell

    // similar to a messageBox in c#, if OK is clicked returns true, if cancel is pressed returns false
    if(confirm(`Are you sure about deleting preset record ${$("#presetName").text()}`))
    {
        let deleteData = {};
        deleteData["presetID"] = $("#presetStatus").val();        

        console.log(deleteData);

        ServerAJAX(projectURL + "DeletePreset", "post", deleteData, "json", ServerSuccess, Error);
    }
    else
    {
        console.log("Cancel preset record deletion");
    }
}

/**********************************************************************************************************/
/// Description: If ajax call fails, the console will display the type of req, the status and the error thrown.              
/// Params: ajaxReq - Post or Get request attempt type
///         ajaxStatus - The error status type
///         errorThrown - 
/**********************************************************************************************************/
// error function if ajax call failed
function Error(ajaxReq, ajaxStatus, errorThrown) {
    console.log(ajaxReq + " : " + ajaxStatus + " : " + errorThrown);
}

/**********************************************************************************************************/
/// Description: Ajax call definition to process and send requested weather data to OpenMeteo website url.               
/// Params: url - Openmeteo api website
///         method - GET or POST data
///         reqData - weather info is stored in this data object's properties
///         dataType - retrieve information in JSON or HTML format 
/**********************************************************************************************************/
function AJAX(url, method, reqData, dataType, successMethod, errorMethod) {
    let ajaxOptions = {};

    ajaxOptions['url'] = url;                   // the target website to send the call
    ajaxOptions['method'] = method;             // GET OR POST
    ajaxOptions['data'] = reqData;              // data object to obtain
    ajaxOptions['dataType'] = dataType;         // JSON or HTML format

    let con = $.ajax(ajaxOptions);

    // on Successful call of successMethod
    con.done(successMethod);

    // on Failure call errorMethod
    con.fail(errorMethod);
}

/**********************************************************************************************************/
/// Description: Server call to send data converted to JSON to the project webservice. 
/// Params: projectURL - Project URL
///         method - GET or POST data
///         reqData - weather info is stored in this data object's properties
///         dataType - retrieve information in JSON or HTML format
///         successMethod - success function to be executed
///         errorMethod - error function on error
/**********************************************************************************************************/
function ServerAJAX(url, method, reqData, dataType, successMethod, errorMethod) {
    let ajaxOptions = {};

    ajaxOptions['url'] = url;                   // the target website to send the call
    ajaxOptions['method'] = method;             // GET OR POST
    ajaxOptions['data'] = reqData ? JSON.stringify(reqData) : null;              // data object to obtain
    ajaxOptions['dataType'] = dataType;         // JSON or HTML format
    ajaxOptions['contentType'] = "application/json";    // NEW for C#

    let con = $.ajax(ajaxOptions);

    // on Successful call of successMethod
    con.done(successMethod);

    // on Failure call errorMethod
    con.fail(errorMethod);
}