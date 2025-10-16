import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Package, Clock, Truck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Composant carte de commande draggable
const SortableOrderCard = ({ order }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-3 cursor-move hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-gray-900">#{order.orderNumber}</p>
          <p className="text-sm text-gray-500">{order.supplier}</p>
        </div>
        <span className="text-sm font-medium text-blue-600">
          {order.total?.toFixed(2)}€
        </span>
      </div>
      
      <p className="text-xs text-gray-500">
        {order.items?.length || 0} produit(s)
      </p>
      
      <p className="text-xs text-gray-400 mt-2">
        {new Date(order.orderDate).toLocaleDateString('fr-FR')}
      </p>
    </div>
  );
};

// Colonne de statut
const StatusColumn = ({ status, orders, title, icon: Icon, color }) => {
  const { setNodeRef } = useSortable({ id: status });

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-w-[300px]">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{orders.length} commande(s)</p>
        </div>
      </div>

      <div ref={setNodeRef} className="space-y-2 min-h-[200px]">
        <SortableContext
          items={orders.map(o => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {orders.map(order => (
            <SortableOrderCard key={order.id} order={order} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

// Composant principal Kanban
export const OrdersKanban = ({ orders: initialOrders, onStatusChange }) => {
  const [orders, setOrders] = useState(initialOrders);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const statuses = [
    { id: 'pending', title: 'En attente', icon: Clock, color: 'bg-amber-500' },
    { id: 'ordered', title: 'Commandé', icon: Package, color: 'bg-blue-500' },
    { id: 'shipped', title: 'Expédié', icon: Truck, color: 'bg-purple-500' },
    { id: 'delivered', title: 'Livré', icon: CheckCircle, color: 'bg-green-500' },
  ];

  // Grouper les commandes par statut
  const ordersByStatus = statuses.reduce((acc, status) => {
    acc[status.id] = orders.filter(o => o.status === status.id);
    return acc;
  }, {});

  // Gérer le début du drag
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Gérer le drop
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    // Trouver la commande déplacée
    const movedOrder = orders.find(o => o.id === active.id);
    
    // Trouver le nouveau statut (soit over est un statut, soit on prend le statut de l'order sur lequel on drop)
    const newStatus = statuses.find(s => s.id === over.id)?.id 
      || orders.find(o => o.id === over.id)?.status;

    if (movedOrder && newStatus && movedOrder.status !== newStatus) {
      try {
        // Mettre à jour localement d'abord (optimistic update)
        setOrders(prevOrders =>
          prevOrders.map(o =>
            o.id === movedOrder.id ? { ...o, status: newStatus } : o
          )
        );

        // Appeler le callback pour mettre à jour en backend
        await onStatusChange(movedOrder.id, newStatus);
        
        const statusLabel = statuses.find(s => s.id === newStatus)?.title;
        toast.success(`Commande déplacée vers "${statusLabel}"`);
      } catch (err) {
        // Rollback en cas d'erreur
        setOrders(initialOrders);
        toast.error('Erreur lors du changement de statut');
        console.error(err);
      }
    }

    setActiveId(null);
  };

  const activeOrder = orders.find(o => o.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map(status => (
          <StatusColumn
            key={status.id}
            status={status.id}
            title={status.title}
            icon={status.icon}
            color={status.color}
            orders={ordersByStatus[status.id]}
          />
        ))}
      </div>

      <DragOverlay>
        {activeOrder ? (
          <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-2xl cursor-grabbing">
            <p className="font-medium text-gray-900">#{activeOrder.orderNumber}</p>
            <p className="text-sm text-gray-500">{activeOrder.supplier}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
