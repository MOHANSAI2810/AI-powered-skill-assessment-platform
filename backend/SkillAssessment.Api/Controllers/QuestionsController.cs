using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using SkillAssessment.Api.Models;

namespace SkillAssessment.Api.Controllers;

[ApiController]
[Route("api/questions")]
public class QuestionsController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    private readonly Dictionary<string, string> _subjectFiles =
        new(StringComparer.OrdinalIgnoreCase)
        {
            { "csharp", "csharp.json" },
            { "dotnet", "dotnet.json" },
            { "react", "react.json" },
            { "angular", "angular.json" },
            { "javascript", "javascript.json" },
            { "reasoning", "reasoning.json" },
            { "aptitude", "aptitude.json" },
            { "english", "english.json" },
            { "cs-fundamentals", "cs-fundamentals.json" }
        };

    public QuestionsController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    // =========================================================
    // GET QUESTIONS
    // =========================================================

    [HttpGet("{subject}")]
    public async Task<IActionResult> GetQuestions(string subject)
    {
        if (!_subjectFiles.TryGetValue(subject, out var fileName))
        {
            return BadRequest("Invalid subject.");
        }

        var filePath = Path.Combine(
            _environment.ContentRootPath,
            "Questions",
            fileName
        );

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound($"Question file not found: {fileName}");
        }

        try
        {
            var json = await System.IO.File.ReadAllTextAsync(filePath);

            var questions =
                JsonSerializer.Deserialize<List<Question>>(
                    json,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }
                );

            if (questions == null || questions.Count == 0)
            {
                return NotFound("No questions found.");
            }

            // Randomly select 20 questions.
            var randomQuestions = questions
                .OrderBy(_ => Random.Shared.Next())
                .Take(20)
                .ToList();

            // IMPORTANT:
            // Do NOT send CorrectOptionId to React.
            var response = randomQuestions.Select(q => new
            {
                q.Id,
                q.Text,
                q.Options
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(
                500,
                $"Error loading questions: {ex.Message}"
            );
        }
    }

    // =========================================================
    // CHECK ANSWER
    // =========================================================

    [HttpPost("check")]
    public async Task<IActionResult> CheckAnswer(
        [FromBody] CheckAnswerRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Subject))
        {
            return BadRequest("Subject is required.");
        }

        if (!_subjectFiles.TryGetValue(
                request.Subject,
                out var fileName))
        {
            return BadRequest("Invalid subject.");
        }

        var filePath = Path.Combine(
            _environment.ContentRootPath,
            "Questions",
            fileName
        );

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(
                $"Question file not found: {fileName}"
            );
        }

        try
        {
            var json =
                await System.IO.File.ReadAllTextAsync(filePath);

            var questions =
                JsonSerializer.Deserialize<List<Question>>(
                    json,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }
                );

            if (questions == null)
            {
                return NotFound("No questions found.");
            }

            var question = questions.FirstOrDefault(
                q => q.Id == request.QuestionId
            );

            if (question == null)
            {
                return NotFound("Question not found.");
            }

            // Compare the selected option with the
            // correct option stored in the JSON file.
            bool isCorrect =
                question.CorrectOptionId ==
                request.SelectedOptionId;

            return Ok(new
            {
                isCorrect = isCorrect,
                questionId = request.QuestionId,
                selectedOptionId = request.SelectedOptionId,
                correctOptionId = question.CorrectOptionId
            });
        }
        catch (Exception ex)
        {
            return StatusCode(
                500,
                $"Error checking answer: {ex.Message}"
            );
        }
    }
}

// =========================================================
// CHECK ANSWER REQUEST
// =========================================================

public class CheckAnswerRequest
{
    public string Subject { get; set; } = string.Empty;

    public int QuestionId { get; set; }

    public int SelectedOptionId { get; set; }
}