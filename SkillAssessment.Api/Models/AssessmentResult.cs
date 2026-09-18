namespace SkillAssessment.Api.Models;

public class AssessmentResult
{
    public int Id { get; set; }

    public string EmailId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Course { get; set; } = string.Empty;

    public int Marks { get; set; }

    public int TotalQuestions { get; set; }

    public decimal Percentage { get; set; }

    public string Remarks { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}