
import { useEffect, useState } from "react";
import {
  FaFileAlt,
  FaComments,
  FaDatabase,
  FaClock,
} from "react-icons/fa";

function getEmployeeToken() {
  return (
    localStorage.getItem("employeeAccessToken") ||
    sessionStorage.getItem("employeeAccessToken") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token")
  );
}

function extractArray(data, keys = []) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function StatsCards() {
  const [stats, setStats] = useState({
    documents: null,
    conversations: null,
    knowledgeBase: null,
    recentActivity: null,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      const token = getEmployeeToken();

      if (!token) {
        if (!cancelled) {
          setStats({
            documents: null,
            conversations: null,
            knowledgeBase: null,
            recentActivity: null,
          });

          setLoading(false);
        }

        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      try {
        const [documentsResult, conversationsResult] =
          await Promise.allSettled([
            fetch(
              "http://127.0.0.1:8000/api/employee/documents",
              {
                headers,
              }
            ),
            fetch(
              "http://127.0.0.1:8000/api/conversations",
              {
                headers,
              }
            ),
          ]);

        let documents = [];
        let conversations = [];

        if (
          documentsResult.status === "fulfilled" &&
          documentsResult.value.ok
        ) {
          const documentData =
            await documentsResult.value.json();

          documents = extractArray(documentData, [
            "documents",
          ]);
        }

        if (
          conversationsResult.status === "fulfilled" &&
          conversationsResult.value.ok
        ) {
          const conversationData =
            await conversationsResult.value.json();

          conversations = extractArray(conversationData, [
            "conversations",
          ]);
        }

        const now = Date.now();

        const sevenDaysAgo =
          now - 7 * 24 * 60 * 60 * 1000;

        const recentConversations = conversations.filter(
          (conversation) => {
            const updatedAt =
              conversation.updated_at ||
              conversation.updatedAt ||
              conversation.created_at ||
              conversation.createdAt;

            if (!updatedAt) {
              return false;
            }

            let timestamp;

            if (
              typeof updatedAt === "number" &&
              updatedAt < 10000000000
            ) {
              timestamp = updatedAt * 1000;
            } else {
              timestamp = new Date(updatedAt).getTime();
            }

            return (
              !Number.isNaN(timestamp) &&
              timestamp >= sevenDaysAgo
            );
          }
        );

        const totalBytes = documents.reduce(
          (total, document) => {
            return total + Number(document.size || 0);
          },
          0
        );

        let knowledgeBase;

        if (totalBytes >= 1024 * 1024 * 1024) {
          knowledgeBase =
            `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        } else if (totalBytes >= 1024 * 1024) {
          knowledgeBase =
            `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
        } else if (totalBytes >= 1024) {
          knowledgeBase =
            `${(totalBytes / 1024).toFixed(1)} KB`;
        } else if (totalBytes > 0) {
          knowledgeBase = `${totalBytes} B`;
        } else {
          knowledgeBase = "0 B";
        }

        if (!cancelled) {
          setStats({
            documents: documents.length,
            conversations: conversations.length,
            knowledgeBase,
            recentActivity: recentConversations.length,
          });
        }
      } catch (error) {
        console.error(
          "Failed to load dashboard statistics:",
          error
        );

        if (!cancelled) {
          setStats({
            documents: null,
            conversations: null,
            knowledgeBase: null,
            recentActivity: null,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      title: "Documents",
      value: loading
        ? "..."
        : stats.documents ?? "—",
      icon: <FaFileAlt />,
    },
    {
      title: "Conversations",
      value: loading
        ? "..."
        : stats.conversations ?? "—",
      icon: <FaComments />,
    },
    {
      title: "Knowledge Base",
      value: loading
        ? "..."
        : stats.knowledgeBase ?? "—",
      icon: <FaDatabase />,
    },
    {
      title: "Recent Activity",
      value: loading
        ? "..."
        : stats.recentActivity ?? "—",
      icon: <FaClock />,
    },
  ];

  const iconStyles = [
    "bg-[#EAF2FB] text-[#7BA7D9]",
    "bg-[#F0F3FA] text-[#8298BD]",
    "bg-[#EDF5F0] text-[#86B99A]",
    "bg-[#FBF6EA] text-[#C5A76D]",
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className="
            rounded-xl
            border border-[#E5EAF0]
            bg-white
            p-5
            shadow-sm
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:border-[#D5DFEA]
            hover:shadow-md
          "
        >
          <div className="flex items-center justify-between gap-3">

            {/* Statistic Information */}
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#8491A3]">
                {card.title}
              </p>

              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#334155]">
                {card.value}
              </h3>
            </div>

            {/* Statistic Icon */}
            <div
              className={`
                flex h-11 w-11 shrink-0
                items-center justify-center
                rounded-xl text-base
                ${iconStyles[index]}
              `}
            >
              {card.icon}
            </div>

          </div>
        </div>
      ))}
    </section>
  );
}

export default StatsCards;