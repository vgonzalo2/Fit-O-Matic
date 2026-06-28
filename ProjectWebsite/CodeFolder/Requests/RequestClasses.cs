// Use with other cs files

namespace ProjectWebsite.Requests
{
    // Note: returning data to micro doesn't need a timestamp property, while a website/Postman requires it

    public class DeviceUpdateRequest
    {
        public string DeviceID { get; set; }
        public string FirmwareVersion { get; set; }
    }

    public class PresetGetRequest
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
