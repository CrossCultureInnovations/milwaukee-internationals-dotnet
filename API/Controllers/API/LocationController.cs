using System.Collections.Generic;
using System.Threading.Tasks;
using API.Abstracts;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class LocationController(ILocationLogic locationLogic) : BasicCrudController<Location>
{
    protected override IBasicCrudLogic<Location> BasicCrudLogic()
    {
        return locationLogic;
    }
    
    [AllowAnonymous]
    [HttpGet]
    [Route("")]
    [SwaggerOperation("GetAll")]
    [ProducesResponseType(typeof(IEnumerable<Location>), 200)]
    public override async Task<IActionResult> GetAll()
    {
        return Ok(await BasicCrudLogic().GetAll());
    }

    /// <summary>
    /// Geocodes a batch of locations that have no coordinates. Batched because the geocoding
    /// provider allows about one lookup per second; the caller repeats until nothing remains.
    /// </summary>
    [HttpPost]
    [Route("geocode-missing")]
    [SwaggerOperation("GeocodeMissing")]
    [ProducesResponseType(typeof(GeocodeSummary), 200)]
    public async Task<IActionResult> GeocodeMissing([FromQuery] int limit = 10)
    {
        return Ok(await locationLogic.GeocodeMissing(limit));
    }

    /// <summary>
    /// Stores a pin dragged to a new position. Deliberately separate from the full update so a drag
    /// cannot overwrite the other fields of a location.
    /// </summary>
    [HttpPatch]
    [Route("{id:int}/coordinates")]
    [SwaggerOperation("SetCoordinates")]
    [ProducesResponseType(typeof(Location), 200)]
    public async Task<IActionResult> SetCoordinates([FromRoute] int id,
        [FromBody] CoordinatesModel coordinates)
    {
        if (coordinates.Latitude is < -90 or > 90 || coordinates.Longitude is < -180 or > 180)
        {
            return BadRequest("Coordinates are out of range.");
        }

        return Ok(await locationLogic.SetCoordinates(id, coordinates.Latitude, coordinates.Longitude));
    }
}

public class CoordinatesModel
{
    public double Latitude { get; set; }

    public double Longitude { get; set; }
}
