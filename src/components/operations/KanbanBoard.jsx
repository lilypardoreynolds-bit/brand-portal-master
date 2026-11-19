import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";

const COLUMNS = [
  { id: "To Do", label: "To Do", color: "bg-slate-100", dot: "bg-slate-400", textColor: "text-slate-700" },
  { id: "In Progress", label: "In Progress", color: "bg-blue-50", dot: "bg-blue-500", textColor: "text-blue-700" },
  { id: "Review", label: "Review", color: "bg-amber-50", dot: "bg-amber-500", textColor: "text-amber-700" },
  { id: "Completed", label: "Completed", color: "bg-green-50", dot: "bg-green-500", textColor: "text-green-700" },
];

export default function KanbanBoard({ tasks, onDragEnd, onEdit, onDelete, onAddTask }) {
  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colTasks = getTasksByStatus(col.id);
          return (
            <div key={col.id} className={`${col.color} rounded-xl p-3 flex flex-col min-h-[400px]`}>
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                  <span className={`text-sm font-semibold ${col.textColor}`}>{col.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full bg-white/60 ${col.textColor} font-medium`}>
                    {colTasks.length}
                  </span>
                </div>
                <Button size="icon" variant="ghost" onClick={() => onAddTask(col.id)} className="h-6 w-6 hover:bg-white/60">
                  <Plus className="h-3.5 w-3.5 text-slate-500" />
                </Button>
              </div>

              {/* Droppable */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-2 min-h-[200px] rounded-lg transition-colors ${snapshot.isDraggingOver ? "bg-white/40" : ""}`}
                  >
                    {colTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.85 : 1,
                            }}
                          >
                            <TaskCard
                              task={task}
                              onEdit={onEdit}
                              onDelete={onDelete}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}