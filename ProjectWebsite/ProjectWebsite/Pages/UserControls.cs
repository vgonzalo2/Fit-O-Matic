/*UserControl Static class with CRUD operations as static methods.*/

//using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;
using System.Diagnostics;
using System.Data;
using Microsoft.Data.SqlClient;
using System.Text.RegularExpressions;

namespace ProjectWebsite.Pages
{
    public static class UserControls
    {
        // connection string to VAV database
        static string connection = "PUT_YOUR_CONNECTION_STRING_HERE";

        static public List<Weather> weatherRecords { get; private set; } = new List<Weather>();
        static public List<Preset> presetRecords { get; private set; } = new List<Preset>();

        // sanitize input data
        public static string CleanInputs(string input)
        {
            return Regex.Replace(input.Trim(), "<.*?>|&.*?;", string.Empty);
        }

        /// <summary>
        ///     Finds the system timezone by its ID (in this case, Edmonton time zone is MST or Mountain Standard Time)
        ///     and returns the DateTime converted from UTC.
        /// </summary>
        /// <returns>
        ///     Returns the DateTime local DateTime, 
        ///     if any errors occur instead returns the DateTime.Min value.
        /// </returns>
        public static DateTime GetCurrentEdmontonTime()
        {
            try
            {
                // find the system timezone of Mountain Standard Time
                // convert the DateTime.UtcNow to local time in the MST time zone
                TimeZoneInfo timeZone = TimeZoneInfo.FindSystemTimeZoneById("Mountain Standard Time");
                DateTime utcNow = DateTime.UtcNow;
                DateTime localTime = TimeZoneInfo.ConvertTimeFromUtc(utcNow, timeZone);

                // return this DateTime value
                return localTime;
            }
            catch(TimeZoneNotFoundException ex)
            {
                Trace.WriteLine("The timezone could not be found.");
                return DateTime.MinValue;
            }
            catch(InvalidTimeZoneException ex)
            {
                Trace.WriteLine("The time zone data is invalid.");
                return DateTime.MinValue;
            }
        }

        /// <summary>
        ///     Connects with the database, retrieving weather data from now to tomorrow to display in the Home page.
        /// </summary>
        public static void SelectWeather()
        {
            using (SqlConnection conn = new SqlConnection(connection))
            {
                try
                {
                    conn.Open();
                    Trace.WriteLine("Connection is open.");

                    // create the select query
                    string selectQuery = "SELECT * FROM WeatherInfo WHERE WeatherDateTime " +
                                         "BETWEEN @hourNow AND @twentyfourHoursAfter";
                    
                    using (SqlCommand command = new SqlCommand(selectQuery, conn))
                    {
                        command.CommandType = System.Data.CommandType.Text;

                        // References User Simon P Stevens: https://stackoverflow.com/questions/2146296/adding-a-time-to-a-datetime-in-c-sharp
                        DateTime date = GetCurrentEdmontonTime();

                        date = date.AddHours(-1);       // want to still include the current hour in the dataset
                        
                        // 24 hours after now
                        DateTime after24Hours = date.AddHours(24);
                        
                        // give the parameters their DateTime values
                        command.Parameters.AddWithValue("@hourNow", date);
                        command.Parameters.AddWithValue("@twentyfourHoursAfter", after24Hours);

                        Trace.WriteLine(selectQuery);

                        // execute the command to execute the query
                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            // read each record and add the data to a list of Weather data objects,
                            // which will be returned as it is a public automatic property
                            int countRecords = 0;
                            while (reader.Read())
                            {
                                int weatherID = (int)reader["WeatherID"];

                                // convert to a Float using Convert.ToSingle as typecasting (float) doesn't work
                                float temperature = Convert.ToSingle(reader["Temperature"]);
                                
                                int precipitation = (int)reader["Precipitation"];

                                DateTime dateRun = DateTime.Parse(reader["WeatherDateTime"].ToString());
                                int weatherCode = (int)reader["WeatherCode"];
                                int isDay = (int)reader["IsDay"];

                                Trace.WriteLine(dateRun);

                                weatherRecords.Add(new Weather(weatherID, temperature, precipitation, dateRun, weatherCode, isDay));

                                countRecords++;
                            }
                            Trace.WriteLine(countRecords);
                        }
                    }
                    conn.Close();
                }
                catch (Exception ex)
                {
                    Trace.WriteLine(ex.Message);
                }
            }
        }

        /// <summary>
        ///     Will delete all weather info and updates it with new data from api call
        /// </summary>
        public static void ReUpdateWeather(UpdateWeather update)
        {
            List<float> Temperature = update.Temperature;
            List<int> Precipitation = update.Precipitation;
            List<DateTime> Time = update.Time.Select(time => DateTime.Parse(time)).ToList();
            List<int> WeatherCode = update.Weather_Code;
            List<int> IsDay = update.Is_day;
            
            using (SqlConnection conn = new SqlConnection(connection))
            {
                try
                {
                    conn.Open();
                    Trace.WriteLine("Connection is open.");

                    // first empty (TRUNCATE) the weather table
                    // (resets the weather id identity column back to 1 and increment by 1)
                    string deleteQuery = "TRUNCATE TABLE WeatherInfo";

                    // delete all weather data from the table
                    using (SqlCommand command = new SqlCommand(deleteQuery, conn))
                    {
                        int rowsDeleted = command.ExecuteNonQuery();
                        Trace.WriteLine($"Deleted {rowsDeleted} rows");
                    }

                    // WeatherID is a identity (auto increment) primary key as values are inserted into the table
                    string insertQuery = "INSERT INTO WeatherInfo (Temperature, Precipitation, WeatherDateTime, WeatherCode, IsDay) " +
                        "VALUES ";

                    // all lists should have the same count
                    for (int i = 0; i < Temperature.Count; i++)
                    {
                        string record = $"{Temperature[i]}, {Precipitation[i]}, '{Time[i]}', {WeatherCode[i]}, {IsDay[i]}";
                        if(i < Temperature.Count - 1)
                            insertQuery += $"({record}), \n";
                        else if(i == Temperature.Count - 1)
                            insertQuery += $"({record}) ";
                    }

                    Trace.WriteLine(insertQuery);

                    int rowsAffected = 0;
                    // INSERT the new data from an api call
                    using (SqlCommand command = new SqlCommand(insertQuery, conn))
                    {
                        rowsAffected = command.ExecuteNonQuery();
                    }
                    Trace.WriteLine($"{rowsAffected} rows affected");
                    conn.Close();                   
                }
                catch (Exception ex)
                {
                    Trace.WriteLine(ex);
                    Trace.WriteLine(ex.Message);
                }
            }
        }

        /// <summary>
        ///     Executes a sql query to retrieve all clothing presets from the database for display on the home page.
        /// </summary>
        /// <returns>Returns the number of records retrieved, otherwise, returns 0.</returns>
        public static int GetPresets()
        {
            using(SqlConnection conn = new SqlConnection(connection))
            {
                try
                {
                    conn.Open();
                    Trace.WriteLine("Connection is open");

                    string selectQuery = "SELECT * from Presets";   // PresetID, CategoryID, PresetName, Image (base64String)

                    int countRecords = 0;
                    using (SqlCommand command = new SqlCommand(selectQuery, conn))
                    {
                        Trace.WriteLine(selectQuery);

                        presetRecords.Clear();

                        // execute the command object to retrieve a sql dataset
                        using(SqlDataReader reader = command.ExecuteReader())
                        {
                            // read through each record
                            while(reader.Read())
                            {
                                Trace.WriteLine(reader.GetString(0));
                                
                                string presetID = reader.GetString(0);
                                int categoryID = (int)reader["CategoryID"];
                                string presetName = reader.GetString(2);
                                string image = reader.GetString(3);

                                // create a Preset object for the record data and add it to a list of Presets
                                presetRecords.Add(new Preset() { PresetID = presetID, CategoryID = categoryID, PresetName = presetName, Image = image});

                                countRecords++; // count how many records have been retrieved
                            }

                            Trace.WriteLine($"{countRecords} rows retrieved");
                        }                        
                    }
                    conn.Close();       // close the database connection

                    return countRecords;    // return how many records have been retrieved
                }
                catch(Exception ex)
                {
                    Trace.WriteLine(ex);
                    Trace.WriteLine(ex.Message);

                    return 0;
                }
            }
        }

        /// <summary>
        ///     Takes in a clothing preset's category id, presetName, and it's image as a base64string.
        ///     Attempts to add the preset to the database table, returning 1 (rowsAffected) if it was added successfully.
        /// </summary>
        /// <param name="CategoryID">What type of clothing is it (Formal, Sunny, Snow, etc)</param>
        /// <param name="PresetName">Name of the preset (determined by user)</param>
        /// <param name="image64Str">The image data stored as a base64String</param>
        /// <returns>Returns the number of rows affected (1 if added succesfully, otherwise 0)</returns>
        public static int AddPreset(int CategoryID, string PresetName, string image64Str)
        {
            using (SqlConnection conn = new SqlConnection(connection))
            {
                try
                {
                    conn.Open();
                    Trace.WriteLine("Connection is open");

                    string getUniqueID = "select TOP 1 UniqueID from UIDs " +
                                         "WHERE Used = 0 ORDER BY UniqueID";

                    string presetID = "";

                    using (SqlCommand command = new SqlCommand(getUniqueID, conn))
                    {
                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                presetID = reader.GetString(0);

                                Trace.WriteLine(presetID);
                            } 
                        }
                    }
                    
                    // used to find if preset is added
                    int rowsAffected = 0;
                    
                    if (presetID != "")
                    {
                        Trace.WriteLine($"Preset ID will be used: {presetID}");

                        string insertQuery = "INSERT INTO Presets (PresetID, CategoryID, PresetName, Image) " +
                            "VALUES (@presetID, @categoryID, @presetName, @image)";

                        using (SqlCommand command = new SqlCommand(insertQuery, conn))
                        {
                            command.CommandType = CommandType.Text;

                            // make it a parameterized query with the passed values
                            command.Parameters.AddWithValue("@presetID", presetID);
                            command.Parameters.AddWithValue("@categoryID", CategoryID);
                            command.Parameters.AddWithValue("@presetName", PresetName);
                            command.Parameters.AddWithValue("@image", image64Str);

                            rowsAffected = command.ExecuteNonQuery();
                        }

                        // check if the Preset was added successfully
                        if (rowsAffected != 0)
                        {
                            string updateQuery = "UPDATE UIDs set Used = 1 " +
                                                 "where UniqueID = @presetID";
                            using(SqlCommand command = new SqlCommand(updateQuery, conn))
                            {
                                command.CommandType = System.Data.CommandType.Text;

                                // make it a parameterized query with the passed presetID
                                command.Parameters.AddWithValue("@presetID", presetID);

                                rowsAffected = command.ExecuteNonQuery();
                            }
                        }
                    }

                    conn.Close();
                    return rowsAffected;
                }
                catch(Exception ex)
                {
                    Trace.WriteLine(ex);
                    Trace.WriteLine(ex.Message);

                    return 0;
                }
            }
        }

        public static int UpdatePreset(string PresetID, string PresetName)
        {
            using (SqlConnection conn = new SqlConnection(connection))
            {
                try
                {
                    conn.Open();
                    Trace.WriteLine("Connection is open");

                    string updatePresetQuery = "Update Presets set PresetName = @presetName " +
                                                "where PresetID = @presetID";

                    int rowsAffected = 0;

                    using (SqlCommand command = new SqlCommand(updatePresetQuery, conn))
                    {
                        command.CommandType = CommandType.Text;

                        command.Parameters.AddWithValue("@presetName", PresetName);
                        command.Parameters.AddWithValue("@presetID", PresetID);

                        rowsAffected = command.ExecuteNonQuery();
                    }

                    conn.Close();

                    return rowsAffected;
                }
                catch (Exception ex)
                {
                    Trace.WriteLine(ex);
                    Trace.WriteLine(ex.Message);
                    return 0;
                }
            }
        }

        public static int DeletePreset(string PresetID)
        {
            using(SqlConnection conn = new SqlConnection(connection))
            {
                try
                {
                    conn.Open();
                    Trace.WriteLine("Connection is open.");

                    // delete a preset using the Preset ID
                    string deletePresetQuery = "DELETE from Presets " +
                                               "where PresetID = @presetID";

                    int rowsAffected = 0;

                    using (SqlCommand command = new SqlCommand(deletePresetQuery, conn))
                    {
                        command.CommandType = CommandType.Text;

                        command.Parameters.AddWithValue("@presetID", PresetID);

                        rowsAffected = command.ExecuteNonQuery();
                    }

                    if(rowsAffected > 0)
                    {
                        // update the UIDs table setting the Used column of the preset to 0
                        // where the UniqueID primary key = PresetID
                        string updateUIDused = "UPDATE UIDs set Used = 0 where UniqueId = @presetID";
                        
                        using(SqlCommand command = new SqlCommand(updateUIDused, conn))
                        {
                            command.CommandType = CommandType.Text;

                            command.Parameters.AddWithValue("@presetID", PresetID);

                            rowsAffected = command.ExecuteNonQuery();
                        }
                    }

                    conn.Close();
                    return rowsAffected;
                }
                catch (Exception ex)
                {
                    Trace.WriteLine(ex);
                    Trace.WriteLine(ex.Message);
                    return 0;
                }
            }
        }
    }
}
