using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkillAssessment.Api.Data;
using SkillAssessment.Api.Models;

namespace SkillAssessment.Api.Controllers;

[ApiController]
[Route("api/assessments")]
public class AssessmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AssessmentsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // Get previous assessments for an email.
    [HttpGet]
    public async Task<IActionResult> GetAssessments(
        [FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest("Email is required.");
        }

        var results = await _context.AssessmentResults
            .Where(x => x.EmailId == email)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(results);
    }

    // Save completed assessment.
    [HttpPost]
    public async Task<IActionResult> SaveAssessment(
        [FromBody] SaveAssessmentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.EmailId))
        {
            return BadRequest("Email is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required.");
        }

        var percentage =
            Math.Round(
                (decimal)request.Marks /
                request.TotalQuestions * 100,
                2
            );

        var remarks = GetRemarks(percentage);

        var result = new AssessmentResult
        {
            EmailId = request.EmailId,
            Name = request.Name,
            Course = request.Course,
            Marks = request.Marks,
            TotalQuestions = request.TotalQuestions,
            Percentage = percentage,
            Remarks = remarks,
            CreatedAt = DateTime.Now
        };

        _context.AssessmentResults.Add(result);

        await _context.SaveChangesAsync();

        return Ok(result);
    }

    private static string GetRemarks(decimal percentage)
    {
        if (percentage >= 90)
            return "Excellent";

        if (percentage >= 80)
            return "Very Good";

        if (percentage >= 70)
            return "Good";

        if (percentage >= 60)
            return "Average";

        return "Needs Improvement";
    }
}

public class SaveAssessmentRequest
{
    public string EmailId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Course { get; set; } = string.Empty;

    public int Marks { get; set; }

    public int TotalQuestions { get; set; }
}