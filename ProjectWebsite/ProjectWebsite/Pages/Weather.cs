using System.ComponentModel;
using System.Data.SqlClient;
using System.Diagnostics;

namespace ProjectWebsite.Pages
{
    public class Weather
    {   
        //static string connection = "Server=tcp:vav.database.windows.net;Database=VAV;User Id=vgonzalo2;Password=tellarKnight763;Encrypted=False";
        public int WeatherID { get; set; }
        public float Temperature { get; set; }
        public int Precipitation { get; set; }
        public DateTime WeatherDateTime { get; set; }
        public int WeatherCode { get; set; }
        public int IsDay { get; set; }

        public Weather(int weatherID, float temperature, int precipitation, DateTime dateRun, int weatherCode, int isDay)
        {
            WeatherID = weatherID;
            Temperature = temperature;
            Precipitation = precipitation;
            WeatherDateTime = dateRun;
            WeatherCode = weatherCode;
            IsDay = isDay;
           
        }

        public override string ToString()
        {
            return $"ID:{WeatherID}, Temp:{Temperature}, Precipitation:{Precipitation},  DateTime:{WeatherDateTime}, WeatherCode:{WeatherCode}, IsDay:{IsDay}";
        }
    }
}
