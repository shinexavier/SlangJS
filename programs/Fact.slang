FUNCTION NUMERIC FACT( NUMERIC d )
    IF ( d <= 0 ) THEN
        RETURN 1;
    ELSE
        RETURN d*FACT(d-1);
    ENDIF
END

FUNCTION BOOLEAN MAIN()
    NUMERIC d;
    d=0;
    WHILE ( d <= 10 )
        PRINT FACT(d);
        d = d+1;
    WEND
END