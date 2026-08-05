using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Models.Entities;

namespace DAL.Entities;

public class GlobalConfigEntity : IEntityTypeConfiguration<GlobalConfigs>
{
    public void Configure(EntityTypeBuilder<GlobalConfigs> builder)
    {
        builder.ToTable("GlobalConfigEntries")
            .HasIndex(config => config.Key)
            .IsUnique();
    }
}