using System;
using System.Data;
using System.Diagnostics;

using Microsoft.EntityFrameworkCore;            // download Nuget Package
using ProjectWebsite.Pages;
using Microsoft.AspNetCore.Mvc;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using ProjectWebsite.Requests;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();               // For Razor Pages
builder.Services.AddControllersWithViews();     // For MVC controllers with views
builder.Services.AddControllers();              // For API controllers

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

// redirects HTTP requests to HTTPS
app.UseHttpsRedirection();

// enable static files: HTML, CSS, images, and JavaScript
app.UseStaticFiles();           

app.UseRouting();

// user authorized to access secure resources (could be removed as app doesn't use authorization)
app.UseAuthorization();

// endpoint mapping 
app.MapRazorPages();        // configures endpoint routing for Razor Pages
//app.MapControllerRoute(     // Maps MVC routes
//    name: "default",
//    pattern: "{controller=Home}/{action=Index}/{id?}");
app.MapControllers();


// Route endpoint when form loads and does a OpenMeteo api call, repopulate the WeatherInfo table only once 
app.MapPost("/ReUpdateWeather", (UpdateWeather update) =>
{
    Trace.WriteLine("WithinUpdateWeather");
    string action = UserControls.CleanInputs(update.Action);

    foreach (var temp in update.Time)
    {
        Trace.WriteLine(temp);        
    }

    // if there is any values within temperature, precipitation, time, weathercode, and is_day lists 
    if (update.Temperature.Any() && update.Precipitation.Any() && update.Time.Any() && update.Weather_Code.Any() && update.Is_day.Any())
        // update the weather
        UserControls.ReUpdateWeather(update);
    return Results.Ok(
        new
        {
            action = action,
            message = "Updated database with new weather data"
        });
});

List<DateTime> dateTimes = new List<DateTime>();
List<float> temperatures = new List<float>();
List<int> weathercodes = new List<int>(); 

// Display Weather in the index/home html page (after we make it so that the data doesn't need to be updated by a button click)
app.MapGet("/DisplayWeather", () =>
{
    UserControls.weatherRecords.Clear();
    UserControls.SelectWeather();    

    List<float> Temperature = new List<float>();
    List<int> Precipitation = new List<int>();
    List<DateTime> Time = new List<DateTime>();
    List<int> WeatherCode = new List<int>();
    List<int> IsDay = new List<int>();

    foreach (var data in UserControls.weatherRecords)
    {
        Trace.WriteLine(data);
        Temperature.Add(data.Temperature);
        Precipitation.Add(data.Precipitation);
        Time.Add(data.WeatherDateTime);
        WeatherCode.Add(data.WeatherCode);
        IsDay.Add(data.IsDay);
    }

    dateTimes = Time;
    temperatures = Temperature;
    weathercodes = WeatherCode;

    if (UserControls.weatherRecords.Count() > 0)
    {
        return Results.Ok(
            new
            {
                action = "DisplayWeather",
                Temperature,
                Precipitation,
                Time,
                WeatherCode,
                IsDay
            });
    }

    // returns a bad request in which it will display a link
    // that redirects to a html displaying this message
    return Results.BadRequest("Failed retrieving weather data");
});

// Post Request from UI to add a new Preset outfit to the Preset Table
app.MapPost("/AddPreset", (AddPreset preset) =>
{
    // Clean inputs from HTML tags (base64 string shouldn't contain these tags)
    string action = UserControls.CleanInputs(preset.Action);
    int categoryID = preset.CategoryID;
    string presetName = UserControls.CleanInputs(preset.PresetName);
    string image64Str = preset.Image64Str;

    Trace.WriteLine(action);
    Trace.WriteLine(categoryID);
    Trace.WriteLine(presetName);
    Trace.WriteLine(image64Str);

    // server validate that the action was AddPreset, the presetName and image64Str are not empty (length of 0)
    // and the categoryID > 0
    if (action == "AddPreset" && presetName.Length > 0 && categoryID > 0 && image64Str.Length > 0)
    {
        // obtain the rows affected
        int rowsAffected = UserControls.AddPreset(categoryID, presetName, image64Str);

        // if the rowsAffected is greater than 0 (technically only adding 1 preset)
        if(rowsAffected > 0)
        {            
            // return the Results Ok response with a anonymous type containing this action and a message
            return Results.Ok(new { action=action, message = $"Preset {presetName} was added successfully." });
        }
        else
        {
            // return the Results Ok response but with a anonymous type containing this action
            // and a error message
            return Results.Ok(
                new 
                { 
                    action = action, 
                    message = "Failed to add preset. No available id to correlate with the preset. 4 presets can be stored at a time, delete previous presets before adding again.." 
                });
        }
    }
    else
    {
        // return the Results BadRequest response if any of the expected JSON data from the client was not found
        return Results.Ok(new { action = action, message = "Invalid action or missing required fields." });
    }

});

// UPDATE: PresetID is now string
Dictionary<string, string> presetDict = new Dictionary<string, string>();

// list of category ids and preset ids
List<int> categoryIDs = new List<int>();
List<string> presetIDs = new List<string>();
app.MapGet("/GetPresets", () =>
{
    Trace.WriteLine("Inside GetPresets");

    // Clear the list of preset records
    UserControls.presetRecords.Clear();

    // clear the collections
    presetDict.Clear();
    categoryIDs.Clear();
    presetIDs.Clear();

    List<string> PresetIDs = new List<string>();
    List<int> CategoryIDs = new List<int>();
    List<string> PresetNames = new List<string>();
    List<string> Images = new List<string>();

    // retrieve all presets
    int recordsRetrieved = UserControls.GetPresets();
    foreach (var data in UserControls.presetRecords)
    {
        Trace.WriteLine(data);

        PresetIDs.Add(data.PresetID);
        CategoryIDs.Add(data.CategoryID);
        PresetNames.Add(data.PresetName);
        Images.Add(data.Image);
    }

    // create the preset dictionary by zipping the ids with the names and ToDictionary() it
    presetDict = PresetIDs.Zip(PresetNames, (key, value) => new { key, value})
                      .ToDictionary(x => x.key, x=> x.value);

    // For use with the Microcontroller's Post request
    categoryIDs = CategoryIDs;
    presetIDs = PresetIDs;

    // if there was records retrieved 
    if (recordsRetrieved > 0)
    {
        // return Ok response
        return Results.Ok(
            new
            {
                action = "GetPresets",
                message = $"{recordsRetrieved} presets retrieved",
                PresetIDs,
                CategoryIDs,
                PresetNames,
                Images
            });
    }

    // return Ok response but presets are not retrieved
    return Results.Ok(
        new
        {
            action = "GetPresets",
            message = "No presets retrieved"
        });
});

// Update preset name
app.MapPost("/UpdatePreset", (UpdatePreset preset) =>
{
    string presetID = UserControls.CleanInputs(preset.PresetID);
    string presetName = UserControls.CleanInputs(preset.PresetName);

    if(presetID.Length == 0 || presetName.Length == 0)
    {
        return Results.BadRequest(new { message = "Preset id or name was not supplied." });
    }

    int rowsAffected = UserControls.UpdatePreset(presetID, presetName);

    if(rowsAffected == 0)
    {
        return Results.BadRequest(new { message = "Preset name could not be updated." });
    }

    // after updating the preset name need to make another GetPreset() call
    return Results.Ok(new
    {
        action = "UpdatePreset",
        
        message = $"Updated preset {presetID} name to {presetName}"
    });
});

// Delete Preset 
app.MapPost("/DeletePreset", (DeletePreset preset) =>
{
    string presetID = UserControls.CleanInputs(preset.PresetID);

    if (presetID.Length == 0)
    {
        return Results.BadRequest("Preset id was not supplied" );
    }

    int rowsAffected = UserControls.DeletePreset(presetID);

    if (rowsAffected == 0)
    {
        return Results.BadRequest("Preset could not be deleted.");
    }

    return Results.Ok(new
    {
        action = "DeletePreset",
        message = $"Successfully deleted preset {presetID}"
    });
});

// MicroController Get Status of connection
app.MapGet("/api/device/status", () =>
{
    DateTime localNow = UserControls.GetCurrentEdmontonTime();

    //Trace.WriteLine(now);

    //DateTime nowToday = dateTimes.Find(datetime => datetime.Date == now.Date && datetime.Hour == now.Hour);

    Trace.WriteLine("Current Hour object in the list of DateTimes: " + localNow);

    localNow = new DateTime(localNow.Year, localNow.Month, localNow.Day, localNow.Hour, 0, 0);
    int index = dateTimes.IndexOf(localNow);

    Trace.WriteLine(index);

    var response = new
    {
        status = "OK",
        message = "Device connected successfully.",
        date = localNow.ToString(),
        current = temperatures[index],
        weathercode = weathercodes[index]
    };

    return Results.Ok(response);
});


PresetGetRequest presetReq = null;

Dictionary<int, string> categoryNames = new Dictionary<int, string>();
categoryNames.Clear();
categoryNames[0] = "Casual";
categoryNames[1] = "Formal";
categoryNames[2] = "Snow";
categoryNames[3] = "Rain";
categoryNames[4] = "Sunny";

// Microcontroller POST call for the current preset
app.MapPost("/api/getpreset", (CurrentPreset preset) => {
    
    string presetID = preset.PresetID;

    if (!presetDict.ContainsKey(presetID))
    {
        return Results.BadRequest(new { message = "Invalid preset ID" });
    }

    presetReq = new PresetGetRequest { Id = presetID, Name = presetDict[presetID], Timestamp = DateTime.UtcNow };

    // obtain the id's index in the list of preset ids
    int index = presetIDs.IndexOf(presetID);

    // get the category with that index
    string category = categoryNames[index];

    return Results.Ok(new {presetID = presetID, name = presetDict[presetID], category = category, message = "Retrieved current preset successfully.", timestamp = DateTime.Now.ToLocalTime() });
});

// Send the currentPreset if the preset id is supplied from the Microcontroller
app.MapGet("/api/currentpreset", () => {
 
    if (presetReq == null)
    {
        return Results.BadRequest(new { message = "No presets exists." });
    }

    return Results.Ok(new { presetID = presetReq.Id, name = presetReq.Name, message = "Retrieved current preset successfully.", timestamp = DateTime.Now.ToLocalTime() });
});

app.Run(); // run app

// record of data sent from the Client side's api call, Hourly array has string time, and double temp and int weather code
// so a dictionary of string key and list of objects (properties are different types of arrays) can work
public record UpdateWeather(string Action, List<float> Temperature, List<int> Precipitation, List<string> Time, List<int> Weather_Code, List<int> Is_day);

// record when the Microcontroller (Raspberry Pi) calls the api/getpreset endpoint
public record CurrentPreset(string PresetID);

// record when Preset is uploaded to the database in UploadPreset Page
public record AddPreset(string Action, int CategoryID, string PresetName, string Image64Str);

// record when Preset's name is to be updated
public record UpdatePreset(string PresetID, string PresetName);

// record for Preset to be deleted
public record DeletePreset(string PresetID);