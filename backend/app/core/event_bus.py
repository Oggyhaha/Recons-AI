import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Callable, List

logger = logging.getLogger(__name__)

class EventBus(ABC):
    @abstractmethod
    async def publish(self, topic: str, event: Dict[str, Any]) -> str:
        pass

    @abstractmethod
    async def subscribe(self, topic: str, handler: Callable[[Dict[str, Any]], Any]) -> None:
        pass

class InMemoryEventBus(EventBus):
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[Dict[str, Any]], Any]]] = {}
        self._event_log: List[Dict[str, Any]] = []

    async def publish(self, topic: str, event: Dict[str, Any]) -> str:
        event_id = f"evt_{len(self._event_log) + 1}"
        envelope = {"id": event_id, "topic": topic, "payload": event}
        self._event_log.append(envelope)
        
        handlers = self._subscribers.get(topic, [])
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    asyncio.create_task(handler(envelope))
                else:
                    handler(envelope)
            except Exception as e:
                logger.error(f"Error dispatching event {event_id} to handler: {e}")
        return event_id

    async def subscribe(self, topic: str, handler: Callable[[Dict[str, Any]], Any]) -> None:
        if topic not in self._subscribers:
            self._subscribers[topic] = []
        self._subscribers[topic].append(handler)

# Global event bus singleton
event_bus: EventBus = InMemoryEventBus()
