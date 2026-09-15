using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using SkillAssessment.Api.Models;

namespace SkillAssessment.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuestionsController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public QuestionsController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpGet("{subject}")]
    public IActionResult GetQuestions(string subject)
    {
        var fileName = subject.ToLower() switch
        {
            "csharp" => "csharp.json",
            "dotnet" => "dotnet.json",
            "react" => "react.json",
            "angular" => "angular.json",
            "javascript" => "javascript.json",
            "reasoning" => "reasoning.json",
            "aptitude" => "aptitude.json",
            "english" => "english.json",
            "cs-fundamentals" => "cs-fundamentals.json",
            _ => null
        };

        if (fileName == null)
        {
            return BadRequest("Invalid subject.");
        }

        var filePath = Path.Combine(
            _environment.ContentRootPath,
            "Data",
            fileName
        );

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound($"Question file not found: {fileName}");
        }

        try
        {
            var json = System.IO.File.ReadAllText(filePath);

            var questions = JsonSerializer.Deserialize<List<Question>>(
                json,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }
            );

            if (questions == null || questions.Count == 0)
            {
                return StatusCode(
                    500,
                    $"No questions found in {fileName}"
                );
            }

            // Randomly select 20 questions
            var selectedQuestions = questions
                .OrderBy(x => Random.Shared.Next())
                .Take(20)
                .ToList();

            return Ok(selectedQuestions);
        }
        catch (JsonException ex)
        {
            return StatusCode(
                500,
                $"Invalid JSON in {fileName}: {ex.Message}"
            );
        }
        catch (Exception ex)
        {
            return StatusCode(
                500,
                $"Error loading questions: {ex.Message}"
            );
        }
    }
}