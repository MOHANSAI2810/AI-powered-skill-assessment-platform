using Microsoft.EntityFrameworkCore;
using SkillAssessment.Api.Models;

namespace SkillAssessment.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<AssessmentResult> AssessmentResults =>
        Set<AssessmentResult>();
}