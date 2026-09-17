import * as React from "react";
import HTMLFlipBook from "@vuvandinh203/react-flipbook";

import styles from "./FlipBook.module.scss";

interface IBookPage {
  id: number;
  pageNumber: number;
  imageUrl: string;
}

interface IPageProps {
  image: string;
}

const BookPages: IBookPage[] = [
    {
    id: 3,
    pageNumber: 3,
    imageUrl: "3.jpg",
  },  {
    id: 4,
    pageNumber: 4,
    imageUrl: "4.jpg",
  },
   {
    id: 5,
    pageNumber: 5,
    imageUrl: "5.jpg",
  },
    {
    id: 6,
    pageNumber: 6,
    imageUrl: "6.jpg",
  },
    {
    id: 7,
    pageNumber: 7,
    imageUrl: "7.jpg",
  },
    {
    id: 8,
    pageNumber: 8,
    imageUrl: "8.jpg",
  },
    {
    id: 9,
    pageNumber: 9,
    imageUrl: "9.jpg",
  },
  
];

const Page = React.forwardRef<HTMLDivElement, IPageProps>(
  ({ image }, ref) => {
    return (
      <div ref={ref} className={styles.page}>
        <img src={image} alt="" />
      </div>
    );
  }
);

Page.displayName = "Page";

export const FlipBook = () => {
  const [pages, setPages] = React.useState<IBookPage[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [previousPage, setPreviousPage] = React.useState<number>(1);
  const [isMobile, setIsMobile] = React.useState<boolean>(false);
  const [zoomScale, setZoomScale] = React.useState<number>(1);
  const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 });
  const pinchStartDistance = React.useRef<number | null>(null);
  const pinchStartScale = React.useRef<number>(1);
  const pinchStartPan = React.useRef({ x: 0, y: 0 });
  const panStartPoint = React.useRef<{ x: number; y: number } | null>(null);
  const panStartOffset = React.useRef({ x: 0, y: 0 });

  // Flipbook ref
  const bookRef = React.useRef<any>(null);

  const getTouchDistance = (touches: React.TouchList): number => {
    const firstTouch = touches[0];
    const secondTouch = touches[1];

    return Math.hypot(
      secondTouch.clientX - firstTouch.clientX, 
      secondTouch.clientY - firstTouch.clientY
    );
  };

  const getTouchMidpoint = (touches: React.TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  const clampPanOffset = (
    offset: { x: number; y: number },
    scale: number,
    container: HTMLElement
  ) => {
    const maxX = ((scale - 1) * container.clientWidth) / 2;
    const maxY = ((scale - 1) * container.clientHeight) / 2;

    return {
      x: Math.min(maxX, Math.max(-maxX, offset.x)),
      y: Math.min(maxY, Math.max(-maxY, offset.y)),
    };
  };

  const handlePinchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1 && zoomScale > 1) {
      event.preventDefault();
      event.stopPropagation();
      panStartPoint.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
      panStartOffset.current = panOffset;
      return;
    }

    if (event.touches.length !== 2) return;

    event.preventDefault();
    event.stopPropagation();
    pinchStartDistance.current = getTouchDistance(event.touches);
    pinchStartScale.current = zoomScale;
    pinchStartPan.current = panOffset;
    panStartPoint.current = null;
  };

  const handlePinchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1 && zoomScale > 1) {
      event.preventDefault();
      event.stopPropagation();

      if (panStartPoint.current) {
        const container = event.currentTarget.querySelector<HTMLElement>(
          `.${styles.flipbookContainer}`
        );

        if (container) {
          const deltaX = event.touches[0].clientX - panStartPoint.current.x;
          const deltaY = event.touches[0].clientY - panStartPoint.current.y;
          const nextOffset = clampPanOffset(
            {
              x: panStartOffset.current.x + deltaX,
              y: panStartOffset.current.y + deltaY,
            },
            zoomScale,
            container
          );

          setPanOffset(nextOffset);
        }
      }

      return;
    }

    if (event.touches.length !== 2 || pinchStartDistance.current === null) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const scaleChange =
      getTouchDistance(event.touches) / pinchStartDistance.current;
    const nextScale = Math.min(
      3,
      Math.max(1, pinchStartScale.current * scaleChange)
    );

    const container = event.currentTarget.querySelector<HTMLElement>(
      `.${styles.flipbookContainer}`
    );
    const midpoint = getTouchMidpoint(event.touches);

    if (container) {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const scaleRatio = nextScale / pinchStartScale.current;

      setPanOffset(
        clampPanOffset(
          {
            x:
              pinchStartPan.current.x +
              (midpoint.x - centerX - pinchStartPan.current.x) *
                (1 - scaleRatio),
            y:
              pinchStartPan.current.y +
              (midpoint.y - centerY - pinchStartPan.current.y) *
                (1 - scaleRatio),
          },
          nextScale,
          container
        )
      );
    }

    setZoomScale(nextScale);
  };

  const handlePinchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (pinchStartDistance.current !== null || zoomScale > 1) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (event.touches.length < 2) {
      pinchStartDistance.current = null;
    }

    if (zoomScale <= 1) {
      setPanOffset({ x: 0, y: 0 });
    }

    panStartPoint.current = null;
  };

  // Detect mobile
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 500);
    };

    // Initial value
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Load pages
  React.useEffect(() => {
    const loadPages = async (): Promise<void> => {
      try {
        const results: IBookPage[] = BookPages
          .map((item: IBookPage) => ({
            id: item.id,
            pageNumber: item.pageNumber,
            imageUrl: item.imageUrl,
          }))
          .sort(
            (a, b) => a.pageNumber - b.pageNumber
          );

        setPages(results);
      } catch (error) {
        console.error(
          "Error loading book pages",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, []);

  // Add env parameter
  React.useEffect(() => {
    const url = new URL(window.location.href);

    if (!url.searchParams.has("env")) {
      url.searchParams.set("env", "WebView");
      window.location.replace(url.toString());
    }
  }, []);

  if (loading) {
    return <div>Loading FlipBook...</div>;
  }

  if (!pages.length) {
    return (
      <div>
        No images found in BookPages library.
      </div>
    );
  }

  return (
    <>
      {/* Page counter */}
      <div className={styles.pagingDesign}>
        {isMobile
          ? `Page ${currentPage} of ${pages.length}`
          : currentPage === 1
          ? `Page ${currentPage} of ${pages.length}`
          : `Page ${currentPage} - ${previousPage} of ${pages.length}`}
      </div>

      {/* Flipbook wrapper */}
      <div
        className={styles.flipbookWrapper}
        onTouchStartCapture={handlePinchStart}
        onTouchMoveCapture={handlePinchMove}
        onTouchEndCapture={handlePinchEnd}
      >

        {/* Previous button */}
        {currentPage > 1 && (
          <button
            className={styles.navButtonLeft}
            onClick={() => {
              bookRef.current
                ?.pageFlip()
                ?.flipPrev();
            }}
          >
            ❮
          </button>
        )}

        {/* Flipbook */}
        <div
          className={styles.flipbookContainer}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
            transformOrigin: "center center",
          }}
        >
          <HTMLFlipBook
            key={isMobile ? "mobile" : "desktop"}
            ref={bookRef}
            width={500}
            height={650}
            minWidth={400}
            maxWidth={900}
            minHeight={600}
            maxHeight={1200}
            size="stretch"
            autoSize={false}
            usePortrait={isMobile}
            showCover={true}
            drawShadow={false}
            maxShadowOpacity={0.2}
            showPageCorners={true}
            flippingTime={200}
            onFlip={(e: any) => {
              const newPage = e.data + 1;

              setPreviousPage(currentPage);
              setCurrentPage(newPage);
            }}
          >
            {pages.map((page) => (
              <Page
                key={page.id}
                image={page.imageUrl}
              />
            ))}
          </HTMLFlipBook>
        </div>

        {/* Next button */}
        {currentPage < pages.length && (
          <button
            className={styles.navButtonRight}
            onClick={() => {
              bookRef.current
                ?.pageFlip()
                ?.flipNext();
            }}
          >
            ❯
          </button>
        )}
      </div>
    </>
  );
};

export default FlipBook;