using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkillAssessment.Api.Data;
using SkillAssessment.Api.Services;

namespace SkillAssessment.Api.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly AiSummaryService _ai;

    public AiController(ApplicationDbContext context, AiSummaryService ai)
    {
        _context = context;
        _ai = ai;
    }

    // GET /api/ai/summary?email=xxx
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest("Email is required.");

        var results = await _context.AssessmentResults
            .Where(x => x.EmailId == email)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync();

        if (results.Count == 0)
            return Ok(new { summary = "No assessments completed yet." });

        var name = results.Last().Name;

        try
        {
            var summary = await _ai.GenerateSummaryAsync(name, results);
            return Ok(new { summary });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}