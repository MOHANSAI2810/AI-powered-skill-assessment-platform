namespace SkillAssessment.Api.Models;

public class AiOptions
{
    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.groq.com/openai/v1";
    public string Model { get; set; } = "openai/gpt-oss-20b";
}