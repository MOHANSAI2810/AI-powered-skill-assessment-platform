namespace SkillAssessment.Api.Models;

public class Question
{
    public int Id { get; set; }

    public string Text { get; set; } = string.Empty;

    public List<QuestionOption> Options { get; set; } = new();

    public int CorrectOptionId { get; set; }
}