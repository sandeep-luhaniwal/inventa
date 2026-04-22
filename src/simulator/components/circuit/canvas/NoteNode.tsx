"use client"
import { Note } from "@/simulator/types/circuit";
import { useState, useRef, useEffect } from "react";
import { Group, Rect, Text } from "react-konva";
import { Html } from "react-konva-utils";

interface NoteNodeProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

const NoteNode = ({ note, onUpdate, onDelete }: NoteNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(note.text);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate(note.id, { text });
  };

  return (
    <Group
      x={note.x}
      y={note.y}
      draggable={!isEditing}
      onDragEnd={(e) => {
        onUpdate(note.id, { x: e.target.x(), y: e.target.y() });
      }}
      onDblClick={() => setIsEditing(true)}
    >
      <Rect
        width={note.width}
        height={note.height}
        fill="#fef9c3"
        stroke="#fde047"
        strokeWidth={1}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.1}
        cornerRadius={4}
      />
      {!isEditing ? (
        <Text
          text={note.text}
          width={note.width}
          height={note.height}
          padding={10}
          fontSize={12}
          fill="#854d0e"
          wrap="char"
        />
      ) : (
        <Html>
          <textarea
            value={text}
            onChange={handleTextChange}
            onBlur={handleBlur}
            autoFocus
            style={{
              width: note.width - 4,
              height: note.height - 4,
              margin: 2,
              padding: 8,
              fontSize: '12px',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              resize: 'none',
              color: '#854d0e',
              fontFamily: 'sans-serif'
            }}
          />
        </Html>
      )}
      
      {/* Delete button (small x in corner) */}
      <Group
        x={note.width - 15}
        y={5}
        onClick={(e) => {
          e.cancelBubble = true;
          onDelete(note.id);
        }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'pointer';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
      >
        <Text text="×" fontSize={14} fill="#854d0e" />
      </Group>
    </Group>
  );
};

export default NoteNode;
