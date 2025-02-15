
import EventMap from "@/components/EventMap";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <main className="fixed inset-0 w-full h-full">
      <EventMap />
      <Toaster />
    </main>
  );
};

export default Index;
