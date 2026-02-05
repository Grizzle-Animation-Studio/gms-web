"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CsvUpload } from "@/components/contacts/csv-upload";
import { ColumnMapper, autoDetectMapping } from "@/components/contacts/column-mapper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { importContacts } from "@/app/actions/contact";

type ImportResult = {
    success: boolean;
    imported: number;
    skipped: number;
    errors: string[];
};

export default function ImportContactsPage() {
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [mapping, setMapping] = useState<{ [key: string]: string }>({});
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setResult(null);

        const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            // Handle Excel files
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[];

                if (jsonData.length > 0) {
                    const headers = jsonData[0] as string[];
                    const rows = jsonData.slice(1).map(row => {
                        const obj: any = {};
                        headers.forEach((header, idx) => {
                            obj[header] = (row as any[])[idx] || '';
                        });
                        return obj;
                    }).filter(row => Object.values(row).some(val => val !== ''));

                    setHeaders(headers);
                    setData(rows);
                    setMapping(autoDetectMapping(headers));
                }
            };
            reader.readAsBinaryString(selectedFile);
        } else {
            // Handle CSV files
            Papa.parse(selectedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const headers = results.meta.fields || [];
                    setHeaders(headers);
                    setData(results.data);
                    setMapping(autoDetectMapping(headers));
                },
                error: (error) => {
                    alert(`Error parsing CSV: ${error.message}`);
                },
            });
        }
    };

    const handleClear = () => {
        setFile(null);
        setHeaders([]);
        setData([]);
        setMapping({});
        setResult(null);
    };

    const handleImport = async () => {
        setImporting(true);
        setResult(null);

        // Prepare data with mapping
        const mappedData = data.map(row => {
            const mapped: any = {};
            Object.keys(mapping).forEach(csvColumn => {
                const dbField = mapping[csvColumn];
                if (dbField !== 'ignore' && row[csvColumn]) {
                    mapped[dbField] = row[csvColumn];
                }
            });
            return mapped;
        });

        const result = await importContacts(mappedData);
        setResult(result);
        setImporting(false);
    };

    const canImport = headers.length > 0 &&
        Object.values(mapping).includes('firstName') &&
        Object.values(mapping).includes('companyName');

    return (
        <AppShell>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/contacts">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Import Contacts</h2>
                        <p className="text-muted-foreground">
                            Upload a CSV or Excel file to bulk import contacts
                        </p>
                    </div>
                </div>

                {/* Step 1: Upload File */}
                <CsvUpload
                    onFileSelect={handleFileSelect}
                    selectedFile={file}
                    onClear={handleClear}
                />

                {/* Step 2: Column Mapping */}
                {headers.length > 0 && !result && (
                    <>
                        <ColumnMapper
                            headers={headers}
                            sampleData={data.slice(0, 3)}
                            mapping={mapping}
                            onMappingChange={setMapping}
                        />

                        <Card>
                            <CardHeader>
                                <CardTitle>Preview</CardTitle>
                                <CardDescription>
                                    Showing first 5 rows of {data.length} total contacts
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                {headers.map(header => (
                                                    <th key={header} className="p-2 text-left font-medium">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.slice(0, 5).map((row, idx) => (
                                                <tr key={idx} className="border-b">
                                                    {headers.map(header => (
                                                        <td key={header} className="p-2">
                                                            {row[header]}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleClear}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={!canImport || importing}
                            >
                                {importing ? "Importing..." : `Import ${data.length} Contacts`}
                            </Button>
                        </div>

                        {importing && (
                            <Card>
                                <CardContent className="p-6">
                                    <Progress value={50} className="mb-2" />
                                    <p className="text-sm text-center text-muted-foreground">
                                        Importing contacts...
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {/* Step 3: Results */}
                {result && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {result.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                Import Complete
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Imported</p>
                                    <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                                </div>
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Skipped</p>
                                    <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <p className="font-medium mb-2">Issues encountered:</p>
                                        <ul className="list-disc list-inside text-sm space-y-1">
                                            {result.errors.slice(0, 10).map((error, idx) => (
                                                <li key={idx}>{error}</li>
                                            ))}
                                            {result.errors.length > 10 && (
                                                <li>...and {result.errors.length - 10} more</li>
                                            )}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex justify-end gap-2">
                                <Link href="/contacts">
                                    <Button>View Contacts</Button>
                                </Link>
                                <Button variant="outline" onClick={handleClear}>
                                    Import Another File
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppShell>
    );
}
