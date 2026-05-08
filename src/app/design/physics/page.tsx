import React from "react";
import { physicsChapters } from "@/physics/data/chapters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Physics Lab — Chapters - Inventa",
  description:
    "Browse all Class 12 Physics chapters and interactive virtual experiments.",
};

export default function PhysicsIndexPage() {
  return (
    <div className="physics-index">
      <div className="physics-index-header">
        <div className="physics-index-logo">⚛</div>
        <h1 className="physics-index-title">Physics Virtual Lab</h1>
        <p className="physics-index-subtitle">
          Class 12 — Interactive Experiments
        </p>
      </div>

      <div className="physics-chapters-grid">
        {physicsChapters.map((chapter) => (
          <div key={chapter.id} className="physics-chapter-card">
            <div className="physics-chapter-card-header">
              <span className="physics-chapter-number">
                Chapter {chapter.number}
              </span>
              <h2 className="physics-chapter-title">{chapter.title}</h2>
              <p className="physics-chapter-title-hi">{chapter.titleHi}</p>
            </div>
            <p className="physics-chapter-desc">{chapter.description}</p>
            <div className="physics-chapter-topics">
              {chapter.topics.map((topic) => (
                <a
                  key={topic.id}
                  href={topic.status === "ready" ? topic.route : "#"}
                  className={`physics-topic-link ${
                    topic.status === "coming-soon" ? "disabled" : ""
                  }`}
                >
                  <span className="physics-topic-icon">{topic.icon}</span>
                  <div className="physics-topic-info">
                    <span className="physics-topic-name">{topic.title}</span>
                    <span className="physics-topic-name-hi">
                      {topic.titleHi}
                    </span>
                  </div>
                  {topic.status === "coming-soon" ? (
                    <span className="physics-topic-badge coming-soon">
                      Coming Soon
                    </span>
                  ) : (
                    <span className="physics-topic-badge ready">
                      Start →
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
