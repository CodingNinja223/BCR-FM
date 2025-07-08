import { useEffect, useState } from "react";

export interface ShowItem {
  show: string;
  host: string;
  time: string;
  image: { uri: string };
}

const SHOWS_URL =
  "https://api.allorigins.win/raw?url=http://bcrfm104.co.za.dedi1222.jnb1.host-h.net/shows/";

export default function useBCRShows() {
  const [weekdays, setWeekdays] = useState<ShowItem[]>([]);
  const [saturday, setSaturday] = useState<ShowItem[]>([]);
  const [sunday, setSunday] = useState<ShowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShows = async () => {
      try {
        const res = await fetch(SHOWS_URL);
        const html = await res.text();

        // Each show is contained in a div with class "elementor-image-box-wrapper"
        // Split by that, then parse each block.
        const blocks = html.split('elementor-image-box-wrapper');

        const shows: ShowItem[] = [];

        for (const block of blocks) {
          // Extract title
          const titleMatch = block.match(/<div class="elementor-image-box-title">([\s\S]*?)<\/div>/);
          // Extract description which contains host and time info
          const descMatch = block.match(/<div class="elementor-image-box-description">([\s\S]*?)<\/div>/);
          // Extract image src
          const imgMatch = block.match(/<img[^>]+src="([^">]+)"/);

          if (!titleMatch || !descMatch) continue; // skip if missing essential data

          const title = titleMatch[1].trim();
          const description = descMatch[1].trim();

          // Extract host from description: "Hosted by: NAME"
          const hostMatch = description.match(/Hosted by:\s*([^<\n\r]+)/i);
          // Extract time from description: "Time: TIME"
          const timeMatch = description.match(/Time:\s*([^<\n\r]+)/i);

          shows.push({
            show: title,
            host: hostMatch ? hostMatch[1].trim() : "Unknown",
            time: timeMatch ? timeMatch[1].trim() : "Unknown",
            image: { uri: imgMatch ? imgMatch[1] : "https://via.placeholder.com/300" },
          });
        }

        // Group shows by day keyword in the show or time string
        const weekdays: ShowItem[] = [];
        const saturday: ShowItem[] = [];
        const sunday: ShowItem[] = [];

        shows.forEach(show => {
          const label = (show.show + " " + show.time).toLowerCase();
          if (label.includes("sat")) saturday.push(show);
          else if (label.includes("sun")) sunday.push(show);
          else weekdays.push(show);
        });

        setWeekdays(weekdays);
        setSaturday(saturday);
        setSunday(sunday);
      } catch (error) {
        console.error("Error fetching or parsing shows:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShows();
  }, []);

  return { weekdays, saturday, sunday, loading };
}
