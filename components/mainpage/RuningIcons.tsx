import { cn } from "@/lib/utils";
import { Marquee } from "@/components/ui/marquee";
import Image from "next/image";

const reviews = [
  {
    id: "1",
    img: "/Anasera.png",
  },
  {
    id: "2",
    img: "/Depo.png",
  },
  {
    id: "3",
    img: "/gmart.svg",
  },
  {
    id: "4",
    img: "/Leha-Leha.png",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({ id, img }: { id: string; img: string }) => {
  return (
    <figure
      className={cn(
        "relative h-full w-64 flex justify-center items-center cursor-pointer overflow-hidden rounded-xl p-4",
        // light styles
        "border-gray-950/10 bg-gray-950/10 hover:bg-gray-950/10",
        // dark styles
        "dark:border-gray-50/10 dark:bg-gray-50 dark:hover:bg-gray-50/15"
      )}
    >
      <div className="flex flex-row justify-center items-center">
        <Image
          width={100}
          height={100}
          alt={""}
          src={img}
          className="object-cover"
        />
      </div>
    </figure>
  );
};

export function RunningIcons() {
  return (
    <div className="relative flex w-full pb-16 sm:pb-24 flex-col items-center justify-center overflow-hidden">
      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.id} {...review} />
        ))}
      </Marquee>
      <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r"></div>
      <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l"></div>
    </div>
  );
}
