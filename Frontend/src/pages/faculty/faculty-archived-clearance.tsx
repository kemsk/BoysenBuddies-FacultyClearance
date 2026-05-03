import * as React from "react";

import "../../index.css"; 
import { FacultyHeader } from "../../stories/components/header";
import { useNavigate } from "react-router-dom";
import { SearchInputGroup } from "../../stories/components/input-group";
import { useState } from "react";
import { Divider } from "../../stories/components/divider";
import { Badge } from "../../stories/components/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";

type ArchivedTimelineItem = {
  id: string;
  name: string;
  academicYear: string;
  semester: string;
  clearancePeriodStart: string;
  clearancePeriodEnd: string;
  lastUpdated: string;
  archivedDate: string;
  status?: "COMPLETED" | "INCOMPLETE";
};

export default function FacultyArchiveClearance() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [query, setQuery] = useState("");
  const [timelines, setTimelines] = React.useState<ArchivedTimelineItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const loadTimelines = React.useCallback(() => {
    setLoading(true);
    return fetch("/admin/xu-faculty-clearance/api/faculty/archived-clearance")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { items: ArchivedTimelineItem[] }) => {
        setTimelines(data.items ?? []);
      })
      .catch(() => {
        setTimelines([]);
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    loadTimelines();
  }, [loadTimelines]);

  const yearOptions = React.useMemo(() => {
    const years = [...new Set(timelines.map(t => t.academicYear))];
    return years.sort();
  }, [timelines]);

  const termOptions = React.useMemo(() => {
    const terms = [...new Set(timelines.map(t => t.semester))];
    return terms.sort();
  }, [timelines]);

  const filteredTimelines = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return timelines;
    }

    return timelines.filter((timeline) =>
      [
        timeline.name,
        timeline.academicYear,
        timeline.semester,
        timeline.clearancePeriodStart,
        timeline.clearancePeriodEnd,
        timeline.lastUpdated,
        timeline.archivedDate,
      ].some((value) => value.toLowerCase().includes(needle))
    );
  }, [query, timelines]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <FacultyHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 w-full lg:max-w-4xl lg:mx-auto lg:p-8">

        <h1 className="text-2xl text-left text-primary font-bold">View Clearance Records</h1>


        <div className="mt-5 space-y-5">
          <div className="w-full mt-5">
            <SearchInputGroup
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              containerClassName="h-10"
              placeholder="Search by name, ID, or email..."
            />
          </div>

          <div className="mt-3 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger variant="pill" className="w-max gap-2 rounded-full border-0 bg-[#7c83d6] text-white shadow-none hover:bg-[#6f76cb]">
                <SelectValue placeholder="School Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">School Year</SelectItem>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger variant="pill" className="w-max gap-2 rounded-full border-0 bg-[#7c83d6] text-white shadow-none hover:bg-[#6f76cb]">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Term</SelectItem>
                {termOptions.map((term) => (
                  <SelectItem key={term} value={term}>{term}</SelectItem>
                ))}
              </SelectContent>
            </Select>

              <Select>
                <SelectTrigger variant="pill" className="w-max gap-2">
                  <label>Status:</label>
                  <SelectValue/> 
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
          </div>          
        </div>

        <div className=" space-y-4">
          <div className="space-y-3">
            {filteredTimelines.map((timeline) => (
              <div
                key={timeline.id}
                className="cursor-pointer rounded-xl border border-[#D5DBEB] bg-white  shadow-sm transition-shadow hover:shadow-md"
                onClick={() => navigate(`/faculty-view-clearance?timelineId=${timeline.id}`)}
              >
                <div className="flex items-start justify-between gap-4 px-4 py-3">
                  <h3 className="text-lg font-bold text-foreground">{timeline.name}</h3>

                  <div className="flex items-center gap-2">
                  {timeline.status === "INCOMPLETE" ? (
                    <Badge variant="warning">INCOMPLETE</Badge>
                  ) : (
                    <Badge variant="success">COMPLETED</Badge>
                  )}
                  <div className=" text-xl font-semibold text-foreground">{'>'}</div>
                  </div>
                </div>

                <Divider className="w-[calc(100)] -mx-px m-0" />

                <div className="px-4 py-3  grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2 text-sm text-foreground">
                  <div className="font-semibold">Academic Year</div>
                  <div>{timeline.academicYear}</div>
                  <div className="font-semibold">Semester</div>
                  <div>{timeline.semester}</div>
                  <div className="font-semibold">Clearance Period</div>
                  <div>{timeline.clearancePeriodStart} - {timeline.clearancePeriodEnd}</div>
                  <div className="font-semibold">Last Update</div>
                  <div>{timeline.lastUpdated}</div>
                  <div className="font-semibold">Archived</div>
                  <div>{timeline.archivedDate}</div>
                </div>
              </div>
            ))}
            {filteredTimelines.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500 px-4 ">
                No archived timelines found.
              </div>
            )}
            {loading && (
              <div className="text-center py-8 text-gray-500 px-4">
                Loading...
              </div>
            )}
          </div>
        </div>
        </div>       
      </main>
    </div>
  );
}