FUNCTION BOOLEAN MAIN()
    NUMERIC newterm;
    NUMERIC prevterm;
    NUMERIC currterm;
    currterm = 1;
    prevterm = 0;
    newterm = currterm + prevterm;
    PRINT newterm;
    WHILE ( newterm < 1000 )
        prevterm = currterm;
        currterm = newterm;
        newterm = currterm + prevterm;
        PRINT newterm;
    WEND
END