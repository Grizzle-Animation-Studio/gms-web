"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Phone, Mail, Calendar as CalendarIcon, Users, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { deleteEnquiryActivity } from "@/app/actions/enquiry-attachments";
import { toast } from "sonner";

type Activity = {
    id: string;
    type: string;
    title: string | null;
    content: string;
    meetingDate: Date | null;
    attendees: string | null;
    createdAt: Date;
};

export function ActivityTimeline({
    enquiryId,
    activities
}: {
    enquiryId: string;
    activities: Activity[]
}) {
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "MEETING": return <Users className="h-4 w-4" />;
            case "EMAIL": return <Mail className="h-4 w-4" />;
            case "CALL": return <Phone className="h-4 w-4" />;
            case "NOTE": return <MessageSquare className="h-4 w-4" />;
            default: return <MessageSquare className="h-4 w-4" />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case "MEETING": return "bg-blue-500";
            case "EMAIL": return "bg-purple-500";
            case "CALL": return "bg-green-500";
            case "NOTE": return "bg-gray-500";
            default: return "bg-gray-500";
        }
    };

    const handleDelete = async (activityId: string) => {
        if (!confirm("Delete this activity?")) return;

        const result = await deleteEnquiryActivity(activityId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Activity deleted");
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Activity Timeline</CardTitle>
                        <CardDescription>
                            Notes, meetings, and communications
                        </CardDescription>
                    </div>
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No activities yet. Click Add Note to record meetings or updates.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity, index) => (
                            <div key={activity.id} className="flex gap-4">
                                {/* Timeline line */}
                                <div className="flex flex-col items-center">
                                    <div className={`rounded-full p-2 ${getActivityColor(activity.type)} text-white`}>
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    {index < activities.length - 1 && (
                                        <div className="w-0.5 flex-1 bg-border mt-2" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pb-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {activity.type}
                                                </Badge>
                                                {activity.title && (
                                                    <h4 className="text-sm font-medium">{activity.title}</h4>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                                {activity.meetingDate && (
                                                    <> • <CalendarIcon className="h-3 w-3 inline mx-1" />
                                                        {new Date(activity.meetingDate).toLocaleDateString()}</>
                                                )}
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap">{activity.content}</p>
                                            {activity.attendees && (
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Attendees: {JSON.parse(activity.attendees).join(", ")}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(activity.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* TODO: Add Activity Dialog */}
            {addDialogOpen && (
                <div>Add activity dialog placeholder - Coming soon</div>
            )}
        </Card>
    );
}
