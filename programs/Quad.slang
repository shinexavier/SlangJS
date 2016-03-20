FUNCTION NUMERIC Quad( NUMERIC a , NUMERIC b , NUMERIC c )
    NUMERIC n;
    NUMERIC o;
    n = b*b - 4*a*c;
    PRINT n;
    IF ( n < 0 ) THEN
        o = 0;
    ELSE
        IF ( n == 0 ) THEN
            o = 1;
        ELSE
            o = 2;
        ENDIF
    ENDIF
    RETURN o;
END

FUNCTION BOOLEAN MAIN()
    NUMERIC d;
    d= Quad(2,10,10);
    PRINT d;
    IF ( d == 0 ) THEN
        PRINT "No Roots";
    ELSE
        IF ( d == 1 ) THEN
            PRINT "Discriminant is zero";
        ELSE
            PRINT "Two roots are available";
        ENDIF
    ENDIF
END