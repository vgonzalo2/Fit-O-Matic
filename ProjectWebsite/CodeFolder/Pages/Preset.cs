using System.ComponentModel;
using System.Data.SqlClient;
using System.Diagnostics;

namespace ProjectWebsite.Pages
{
    public class Preset
    {
        //static string connection = "Server=tcp:vav.database.windows.net;Database=VAV;User Id=vgonzalo2;Password=tellarKnight763;Encrypted=False";
        public string PresetID { get; set; }       
        public int CategoryID { get; set; }
        public string? PresetName { get; set; }
        public string? Image { get; set; }

        public override string ToString()
        {
            return $"PresetID: {PresetID}, CategoryID: {CategoryID}, PresetName: {PresetName}, Image: {Image}";
        }
    }
}
