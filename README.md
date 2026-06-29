# Fit-O-Matic - Smart Closet System (Capstone Project)

## Project Overview
The Fit-O-Matic is a **smart closet system** developed as a *collaborative capstone project* (CMPE2965 - Technical Project) in the NAIT Computer Engineering Technology program. It combines a web application and hardware components to help users make outfit decisions using real-time data from an external API.

The repository has been recreated for *portfolio purposes*.

<p align="center">
  <img width="200" src="ProjectImages/Fit-O-MaticAssembledP1.jpg" title="Fit-O-Matic_Assembled Part1">
  <img width="200" src="ProjectImages/Fit-O-MaticAssembledP2.jpg" title="Fit-O-Matic_Assembled Part2">
</p>
<p align="center">
  <em>Final assembled Fit-O-Matic prototype (hardware subsystem developed by a team member).</em>
</p>

## Tech Stack
<p>
  <img width="50" src=https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/c%23.png alt="C#" title= "C#"/>
  <img width="50" src="images/Azure SQL Database.png" alt="Azure SQL Database" title="MSSQL">
  <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/javascript.png" alt="JavaScript" title="JavaScript"/>
  <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/html.png" alt="HTML" title="HTML"/>
  <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/css.png" alt="CSS" title="CSS"/>
</p>

## Architecture & Integrations
- ASP.NET Core (Razor Pages) - Web application framework for structuring pages and handling server-side rendering
- ADO.NET with parameterized queries - Secure database access and execution of SQL queries against Azure SQL Database
- REST API Integration - Retrieval of real-time weather data from Open-Meteo and communication with the hardware system
- Azure SQL Database - Cloud-hosted relational database for application data
- JSON data handling - Parsing and processing API responses

## Key Features
- Displays hourly weather conditions through a web interface
- Enables users to control and interact with the hardware-based closet system through both a web interface and a physical controller board
- Lets users browse an outfit catalog and view the currently selected outfit on the web interface 
- Allow users to update and manage the clothing inventory in the closet system

## My Contributions
- Built and styled web interface features for weather data display, outfit catalog browsing, and inventory management

  *Web interface showing state changes during outfit catalog interaction and inventory updates.* <br>
<p align="center">
  <img width="240" src="ProjectImages/UI_websiteui.jpg" title="UI HomePage">
  <img width="240" src="ProjectImages/UI_editUpdate.png" title="UI EditUpdate">
  <img width="240" src="ProjectImages/UI_dropdownMenu.png" title="UI DropdownMenu">
  <img width="240" src="ProjectImages/UI_requiredFieldsSupplied.png" title="UI FieldsFilled">  
</p>

- Developed application logic using C# and JavaScript for both frontend and backend functionality
- Implemented a data access layer using ADO.NET with parameterized queries for secure database operations
- Developed communication flow between the web application, database, and the hardware controller system


## Hardware Components

*This section highlights the primary hardware components used in the system.*

<table>
  <table border="">
  <tr>
    <td align="center">
      <img width="200" src="ProjectImages/PICO_W_HERO_TRANSPARENT__41312.png" title="Raspberry Pi Pico W" ><br>
       Raspberry Pi Pico W
    </td>
    <td align="center">
      <img width="200" src="ProjectImages/rotatableRackAmazon.jpg" title="Closet Rack"><br>
      Closet rack structure
    </td>
    <td align="center">
      <img width="200" src="ProjectImages/nema17.jpg" title="Nema17 Motor"><br>
      Nema17 motor
    </td>
    <td align="center">
      <img width="200" src="ProjectImages/rfid.png" title="NFC reader + Tags"><br>
      NFC RFID Reader + NFC Tags
    </td>
  </tr>
</table>

</table>

## Project Images
Note: The hardware subsystem was developed by a separate team member and is included for *system context only*.


## Acknowledgements
Hardware design and implementation were primarily completed by Andreas Delfin (https://www.linkedin.com/in/andreas-kizzer-delfin/) as part of the Fit-O-Matic capstone project team.
