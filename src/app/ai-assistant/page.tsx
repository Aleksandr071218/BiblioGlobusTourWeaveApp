import { AiAssistant } from '@/components/tour/ai-assistant';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';

export default function AiAssistantPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
        <div className="space-y-4">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold tracking-tight">AI Tour Assistant</CardTitle>
                    <CardDescription>
                        Describe your client's ideal vacation and I'll find the perfect packages.
                    </CardDescription>
                </CardHeader>
            </Card>
            <AiAssistant />
        </div>
    </div>
  );
}
