import type { Metadata } from "next";
import { QrCode } from "lucide-react";
import type { RowDataPacket } from "mysql2";
import { PageHeading } from "@/components/page-heading";
import { QrCreateDialog } from "@/components/qr-create-dialog";
import { QrPreviewDialog } from "@/components/qr-preview-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { getQrImageFile } from "@/lib/qr";

export const metadata: Metadata = { title: "QR Codes" };
export const dynamic = "force-dynamic";

interface QrCodeRow extends RowDataPacket {
  id: number;
  qr_name: string;
  qr_link: string;
  date_added: Date | string;
}

export default async function QrCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const params = await searchParams;
  let records: QrCodeRow[] = [];
  let databaseError = "";
  try {
    const [rows] = await db.execute<QrCodeRow[]>(
      "SELECT id, qr_name, qr_link, date_added FROM qr_code ORDER BY date_added DESC, id DESC",
    );
    records = rows;
  } catch (error) {
    console.error("Could not load QR code records:", error);
    databaseError = "QR codes could not be loaded. Check the MySQL connection.";
  }

  return (
    <>
      <PageHeading
        title="QR Codes"
        description="Create and manage QR codes for your campaigns and content."
      />
      <Card className="gap-0 overflow-hidden py-0 shadow-sm">
        <CardHeader className="flex flex-col justify-between gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <CardTitle className="text-base">Generated QR Codes</CardTitle>
            <CardDescription className="mt-1">
              Keep your destination links ready to share.
            </CardDescription>
          </div>
          <QrCreateDialog />
        </CardHeader>
        <CardContent className="p-0">
          {params.created && (
            <div className="mx-5 mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 sm:mx-6">
              Your QR code was generated and saved.
            </div>
          )}
          {databaseError && (
            <div role="alert" className="mx-5 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-6">
              {databaseError}
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">QR Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>QR Code Link</TableHead>
                  <TableHead className="w-36">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-36 text-center text-slate-500">
                      {databaseError ? "Records are unavailable." : "No QR codes yet. Create one to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => {
                    const imageUrl = `/qr-images/${getQrImageFile(record.qr_name, record.qr_link)}`;
                    const date = new Date(record.date_added);
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <QrPreviewDialog
                            name={record.qr_name}
                            link={record.qr_link}
                            imageUrl={imageUrl}
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-[#0f1c33]">
                          {record.qr_name}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <a
                            href={record.qr_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-blue-700 hover:underline"
                          >
                            {record.qr_link}
                          </a>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-slate-500">
                          {date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center gap-2 border-t px-5 py-3 text-[11px] text-slate-500">
            <QrCode className="size-4" />
            QR images are generated and stored locally.
            <Badge variant="secondary" className="ml-auto">{records.length} total</Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
