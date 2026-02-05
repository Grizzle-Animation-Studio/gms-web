"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type ColumnMapping = {
    [key: string]: string; // CSV column -> DB field
};

interface ColumnMapperProps {
    headers: string[];
    sampleData: any[];
    mapping: ColumnMapping;
    onMappingChange: (mapping: ColumnMapping) => void;
}

const dbFields = [
    { value: "firstName", label: "First Name", required: true },
    { value: "lastName", label: "Last Name", required: false },
    { value: "email", label: "Email", required: false },
    { value: "phone", label: "Phone", required: false },
    { value: "jobTitle", label: "Job Title", required: false },
    { value: "companyName", label: "Company Name", required: true },
    { value: "ignore", label: "Ignore Column", required: false },
];

// Auto-detect column mappings based on common patterns
export function autoDetectMapping(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {};

    headers.forEach(header => {
        const lower = header.toLowerCase().trim();

        if (lower.includes('first') && lower.includes('name')) {
            mapping[header] = 'firstName';
        } else if (lower === 'name' || lower === 'full name' || lower === 'contact name') {
            mapping[header] = 'firstName'; // User might need to split this
        } else if (lower.includes('last') && lower.includes('name')) {
            mapping[header] = 'lastName';
        } else if (lower.includes('email') || lower.includes('e-mail')) {
            mapping[header] = 'email';
        } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('tel')) {
            mapping[header] = 'phone';
        } else if (lower.includes('job') || lower.includes('title') || lower.includes('position') || lower.includes('role')) {
            mapping[header] = 'jobTitle';
        } else if (lower.includes('company') || lower.includes('organization') || lower.includes('business')) {
            mapping[header] = 'companyName';
        } else {
            mapping[header] = 'ignore';
        }
    });

    return mapping;
}

export function ColumnMapper({ headers, sampleData, mapping, onMappingChange }: ColumnMapperProps) {
    const handleMappingChange = (csvColumn: string, dbField: string) => {
        onMappingChange({
            ...mapping,
            [csvColumn]: dbField,
        });
    };

    const getMappedCount = (field: string) => {
        return Object.values(mapping).filter(v => v === field).length;
    };

    const requiredFields = dbFields.filter(f => f.required);
    const allRequiredMapped = requiredFields.every(field => getMappedCount(field.value) > 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Map Columns</CardTitle>
                <CardDescription>
                    <span>Match your CSV columns to the contact fields</span>
                    {!allRequiredMapped && (
                        <Badge variant="destructive" className="ml-2">Required fields missing</Badge>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {headers.map((header, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-4 items-center">
                        <div>
                            <Label className="font-medium">{header}</Label>
                            <p className="text-sm text-muted-foreground truncate mt-1">
                                Example: {sampleData[0]?.[header] || "N/A"}
                            </p>
                        </div>
                        <div>→</div>
                        <Select
                            value={mapping[header] || "ignore"}
                            onValueChange={(value) => handleMappingChange(header, value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {dbFields.map((field) => (
                                    <SelectItem key={field.value} value={field.value}>
                                        {field.label}
                                        {field.required && <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ))}

                <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Mapping Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {requiredFields.map(field => {
                            const count = getMappedCount(field.value);
                            return (
                                <div key={field.value} className="flex items-center justify-between">
                                    <span>{field.label}:</span>
                                    <Badge variant={count > 0 ? "default" : "destructive"}>
                                        {count > 0 ? "✓ Mapped" : "Missing"}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
