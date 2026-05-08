"use client";

import React from "react";
import { physicsChapters } from "../../data/chapters";
import { PhysicsTopic } from "../../types/physics";

interface PhysicsLabShellProps {
  currentTopicId: string;
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

function TopicNavItem({
  topic,
  isActive,
}: {
  topic: PhysicsTopic;
  isActive: boolean;
}) {
  const isReady = topic.status === "ready";

  return (
    <a
      href={isReady ? topic.route : "#"}
      className={`physics-nav-item ${isActive ? "active" : ""} ${
        !isReady ? "disabled" : ""
      }`}
    >
      <span className="physics-nav-icon">{topic.icon}</span>
      <div className="physics-nav-text">
        <span className="physics-nav-title">{topic.title}</span>
        <span className="physics-nav-title-hi">{topic.titleHi}</span>
      </div>
      {!isReady && <span className="physics-nav-badge">Soon</span>}
    </a>
  );
}

export default function PhysicsLabShell({
  currentTopicId,
  children,
  sidebar,
}: PhysicsLabShellProps) {
  const chapter = physicsChapters[0]; // Chapter 1

  return (
    <div className="physics-lab-shell">
      {/* Left: Chapter Navigation */}
      <aside className="physics-lab-nav">
        <div className="physics-nav-header">
          <div className="physics-nav-logo">
            <span className="physics-nav-logo-icon">⚛</span>
            <span className="physics-nav-logo-text">Physics Lab</span>
          </div>
          <div className="physics-nav-chapter">
            <span className="physics-nav-chapter-num">Chapter {chapter.number}</span>
            <span className="physics-nav-chapter-title">{chapter.title}</span>
            <span className="physics-nav-chapter-hi">{chapter.titleHi}</span>
          </div>
        </div>
        <nav className="physics-nav-topics">
          {chapter.topics.map((topic) => (
            <TopicNavItem
              key={topic.id}
              topic={topic}
              isActive={topic.id === currentTopicId}
            />
          ))}
        </nav>
        <div className="physics-nav-footer">
          <a href="/design/physics" className="physics-nav-back">
            ← All Chapters
          </a>
        </div>
      </aside>

      {/* Center: Experiment Canvas */}
      <main className="physics-lab-canvas">{children}</main>

      {/* Right: Controls & Output */}
      <aside className="physics-lab-sidebar">{sidebar}</aside>
    </div>
  );
}
