using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ProjectWebsite.Requests;

namespace ProjectWebsite.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;

        public IndexModel(ILogger<IndexModel> logger)
        {
            _logger = logger;
        }
       
        /// <summary>
        ///     OnGET, retrieves the latest preset data stored in the PresetService 
        ///     and assigns it to Preset id and PresetName properties to render it directly in the HTML.
        /// </summary>
        public void OnGet()
        {
            
        }       
    }
}
