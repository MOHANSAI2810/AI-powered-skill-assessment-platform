using System.Text;
using System.Text.Json;
using SkillAssessment.Api.Models;

namespace SkillAssessment.Api.Services;

public class AiSummaryService
{
    private readonly HttpClient _http;
    private readonly AiOptions _options;

    public AiSummaryService(HttpClient http, AiOptions options)
    {
        _http = http;
        _options = options;
    }

    public async Task<string> GenerateSummaryAsync(
        string name,
        List<AssessmentResult> results)
    {
        if (results.Count == 0)
        {
            return $"{name} hasn't completed any assessments yet.";
        }

        // 1. Aggregate per subject
        var bySubject = results
            .GroupBy(r => r.Course)
            .Select(g =>
            {
                var ordered = g.OrderBy(x => x.CreatedAt).ToList();
                var avg = Math.Round(g.Average(x => (double)x.Percentage), 1);
                var first = (double)ordered.First().Percentage;
                var last  = (double)ordered.Last().Percentage;
                var trend = last > first + 5 ? "improving"
                          : last < first - 5 ? "declining"
                          : "stable";
                return new
                {
                    Subject  = g.Key,
                    Average  = avg,
                    Attempts = g.Count(),
                    Best     = g.Max(x => x.Percentage),
                    Trend    = trend
                };
            })
            .OrderByDescending(x => x.Average)
            .ToList();

        // 2. Build the prompt
        var dataLines = new StringBuilder();
        foreach (var s in bySubject)
        {
            dataLines.AppendLine(
                $"- {s.Subject}: avg {s.Average}%, " +
                $"{s.Attempts} attempt(s), best {s.Best}%, trend: {s.Trend}");
        }

        var overallAvg = Math.Round(results.Average(r => (double)r.Percentage), 1);
        var firstName = name.Split(' ')[0];

        var prompt = $$"""
            You are an educational performance analyst. Analyze this user's quiz history and write a concise summary.

            User name: {{name}}
            Overall average: {{overallAvg}}%
            Total assessments: {{results.Count}}

            Per-subject performance:
            {{dataLines}}

            STRICT REQUIREMENTS:
            - Use the user's first name only: {{firstName}}
            - Write EXACTLY 5 complete sentences. Do not stop mid-sentence.
            - Sentence 1: Overall rating — start with "{{firstName}} has [Excellent/Good/Average/Needs Improvement] knowledge in [list of strongest subjects]" and end the sentence fully.
            - Sentence 2: Mention the overall average percentage and total number of assessments.
            - Sentence 3: Name the strongest subject with its average, and the weakest subject with its average and trend.
            - Sentence 4: Give the user ONE unique archetype label from: Frontend Specialist, Backend Focused, Full-Stack Learner, Consistent Performer, Needs Foundation, Technical Generalist.
            - Sentence 5: Give ONE concrete, actionable improvement suggestion.
            - Do NOT truncate. Complete every sentence.
            - Plain prose only. No markdown, no bullet points, no headings.
            """;

        // 3. Call Groq (OpenAI-compatible chat completions)
        var request = new
        {
            model = _options.Model,
            messages = new object[]
            {
                new { role = "system", content = "You are a concise educational performance analyst. Always complete your sentences." },
                new { role = "user",   content = prompt }
            },
            temperature = 0.6,
            max_tokens = 1000
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        _http.DefaultRequestHeaders.Clear();
        _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {_options.ApiKey}");

        var response = await _http.PostAsync(
            $"{_options.BaseUrl}/chat/completions",
            content);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            throw new Exception($"AI API error: {response.StatusCode} - {err}");
        }

        var resultJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(resultJson);

        var choice = doc.RootElement.GetProperty("choices")[0];
        var finishReason = choice.TryGetProperty("finish_reason", out var fr)
            ? fr.GetString()
            : null;

        var summary = choice
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        // If the model still truncated, append a marker so we can retry
        if (finishReason == "length")
        {
            Console.WriteLine("[AI] WARNING: Response was truncated by token limit.");
        }

        return summary?.Trim() ?? "Summary unavailable.";
    }
}