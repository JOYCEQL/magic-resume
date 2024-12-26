"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ContributionDay {
  date: string;
  count: number;
}

interface GithubContributionsProps {
  username?: string;
  githubKey?: string;
  className?: string;
  year?: number;
}

const colorLevels = [
  "bg-[#ebedf0]", // 0 contributions
  "bg-[#9be9a8]", // 1-3 contributions
  "bg-[#40c463]", // 4-7 contributions
  "bg-[#30a14e]", // 8-12 contributions
  "bg-[#216e39]", // 13+ contributions
];

const getColorLevel = (count: number): string => {
  if (count === 0) return colorLevels[0];
  if (count <= 3) return colorLevels[1];
  if (count <= 7) return colorLevels[2];
  if (count <= 12) return colorLevels[3];
  return colorLevels[4];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
};

async function fetchGithubContributions(
  username?: string,
  githubKey?: string
): Promise<ContributionDay[]> {
  const token = githubKey;

  if (!token) {
    throw new Error("GitHub token is required");
  }

  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("GitHub API Error:", errorData);
      throw new Error(errorData.message || "Failed to fetch GitHub data");
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GitHub API Error:", data.errors);
      throw new Error(data.errors[0]?.message || "GitHub API Error");
    }

    const calendar =
      data.data?.user?.contributionsCollection?.contributionCalendar;

    if (!calendar) {
      throw new Error("No contribution data found");
    }

    const contributions: ContributionDay[] = [];

    calendar.weeks.forEach((week: any) => {
      week.contributionDays.forEach((day: any) => {
        contributions.push({
          date: day.date,
          count: day.contributionCount,
        });
      });
    });

    return contributions;
  } catch (error) {
    console.error("Error fetching GitHub contributions:", error);
    throw error;
  }
}

const GithubContributions: React.FC<GithubContributionsProps> = ({
  username,
  githubKey,
  className,
  year = 2024,
}) => {
  const [weeks, setWeeks] = useState<ContributionDay[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContributions() {
      try {
        setLoading(true);
        const contributions = await fetchGithubContributions(
          username,
          githubKey
        );

        const yearContributions = contributions.filter((day) => {
          const date = new Date(day.date);
          return date.getFullYear() === year;
        });

        const groupedWeeks: ContributionDay[][] = [];
        let currentWeek: ContributionDay[] = [];

        yearContributions.forEach((day, index) => {
          currentWeek.push(day);
          if (
            currentWeek.length === 7 ||
            index === yearContributions.length - 1
          ) {
            // 如果是最后一周且不满7天，用空数据填充
            if (currentWeek.length < 7) {
              const emptyDays = 7 - currentWeek.length;
              for (let i = 0; i < emptyDays; i++) {
                currentWeek.push({
                  date: "",
                  count: 0,
                });
              }
            }
            groupedWeeks.push([...currentWeek]);
            currentWeek = [];
          }
        });

        setWeeks(groupedWeeks);
        setError(null);
      } catch (err) {
        setError("Failed to load GitHub contributions");
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      loadContributions();
    }
  }, [githubKey, username, year]);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-md"></div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const goGithub = () => {
    window.open(`https://github.com/${username}`, "_blank");
  };

  return (
    <div className="w-full flex  flex-col gap-2">
      <div
        className={cn(
          "w-full flex justify-start gap-[1px]  overflow-hidden",
          className
        )}
      >
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[3px]">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={cn(
                  "w-[13px] h-[13px] rounded-[3px] relative group cursor-pointer",
                  getColorLevel(day.count),
                  "transition-colors duration-200"
                )}
                title={String(day.date)}
                onClick={goGithub}
              >
                {day.date && (
                  <div
                    className="pointer-events-none absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-10"
                    style={{
                      visibility: "hidden",
                      transitionProperty: "opacity, visibility",
                      transitionDuration: "150ms",
                    }}
                  >
                    {formatDate(day.date)}: {day.count} contributions
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GithubContributions;
